'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'
import { obtenerSolicitud } from '@/lib/solicitudes/dal'
import { obtenerTipoAyuda } from '@/lib/ayudas/dal'
import { subirDocumentoSolicitud } from '@/lib/documentos/actions'
import { obtenerMotivoEntregaFallida } from '@/lib/motivos-entrega/dal'
import { obtenerEntregaAsignadaAlUsuario, tieneEvidenciaPrevia } from '@/lib/entregas/registro'
import { tieneRol } from '@/lib/auth/roles'
import { tieneSalidaStock } from '@/lib/inventario/dal'
import { ERROR_SIN_SALIDA_STOCK, MENSAJE_SIN_SALIDA_STOCK } from '@/lib/entregas/types'
import { mensajeErrorBeneficio } from '@/lib/beneficios/types'

// US-12.01/US-12.02: "como bodega o logística" crea y asigna entregas.
const ROLES_LOGISTICA = ['administrador', 'bodega_logistica'] as const
// US-12.04/US-12.05/US-12.07: "como funcionario en terreno" registra el
// resultado de SU entrega asignada.
const ROLES_TERRENO = ['administrador', 'terreno_repartidor'] as const

const ESTADOS_SOLICITUD_PARA_ENTREGA = ['aprobada', 'aprobada_excepcion']
// MR-06: la entrega en local la registra quien atiende en el Departamento
// Social: el gestor social o bodega/logística (y el administrador).
const ROLES_ENTREGA_LOCAL = ['administrador', 'evaluador_social', 'bodega_logistica'] as const

type ValoresCrearEntregaFormulario = { fecha_programada: string; responsable_id: string }

export type CrearEntregaFormState =
  | { error?: string; valores: ValoresCrearEntregaFormulario }
  | undefined

// US-12.01: "solo solicitudes aprobadas pueden generar entrega" · "la
// entrega queda asociada a la solicitud" (dirección se resuelve por join,
// ver lib/entregas/dal.ts) · "la entrega queda en estado pendiente" (default
// de columna) · "se puede asignar responsable" (opcional en esta misma acción).
// MR-08: en un beneficio periódico la entrega es de un período; el trigger
// entregas_validar_periodo exige que pertenezca al beneficio y ya haya comenzado.
export async function crearEntrega(
  solicitudId: string,
  periodo: string | null,
  _prevState: CrearEntregaFormState,
  formData: FormData
): Promise<CrearEntregaFormState> {
  await requireRole([...ROLES_LOGISTICA])

  const valores: ValoresCrearEntregaFormulario = {
    fecha_programada: formData.get('fecha_programada')?.toString().trim() ?? '',
    responsable_id: formData.get('responsable_id')?.toString().trim() ?? '',
  }

  const solicitud = await obtenerSolicitud(solicitudId)
  if (!solicitud) {
    return { error: 'Solicitud no encontrada.', valores }
  }

  if (!ESTADOS_SOLICITUD_PARA_ENTREGA.includes(solicitud.estado)) {
    return { error: 'Solo se puede generar una entrega desde una solicitud aprobada.', valores }
  }

  const tipoAyuda = await obtenerTipoAyuda(solicitud.tipo_ayuda_id)
  if (!tipoAyuda?.requiere_entrega) {
    return { error: 'Este tipo de ayuda no requiere entrega física.', valores }
  }

  // MR-07: también lo exige el trigger; aquí da el mensaje antes de intentar.
  if (!(await tieneSalidaStock(solicitudId, periodo))) {
    return { error: MENSAJE_SIN_SALIDA_STOCK, valores }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('entregas').insert({
    solicitud_id: solicitudId,
    periodo,
    modalidad: 'domicilio',
    fecha_programada: valores.fecha_programada || null,
    responsable_id: valores.responsable_id || null,
  })

  if (error) {
    return {
      error:
        error.code === '23505'
          ? periodo
            ? 'Ya existe una entrega para este período.'
            : 'Ya existe una entrega para esta solicitud.'
          : error.message?.includes(ERROR_SIN_SALIDA_STOCK)
            ? MENSAJE_SIN_SALIDA_STOCK
            : (mensajeErrorBeneficio(error.message) ?? 'No se pudo crear la entrega.'),
      valores,
    }
  }

  revalidatePath(`/solicitudes/${solicitudId}`)
  revalidatePath('/entregas')
}

type ValoresAsignacionFormulario = { fecha_programada: string; responsable_id: string }

export type AsignacionFormState =
  | { error?: string; valores: ValoresAsignacionFormulario }
  | undefined

// US-12.02: "se puede seleccionar responsable" · "la entrega mantiene fecha
// programada" · "la asignación queda registrada" (trigger de
// entregas_historial). Solo mientras la entrega sigue 'pendiente' — una vez
// fallida, cambiar responsable/fecha es reprogramarEntrega (más abajo),
// porque ese caso también debe volver el estado a 'pendiente'.
export async function asignarResponsable(
  entregaId: string,
  _prevState: AsignacionFormState,
  formData: FormData
): Promise<AsignacionFormState> {
  await requireRole([...ROLES_LOGISTICA])

  const valores: ValoresAsignacionFormulario = {
    fecha_programada: formData.get('fecha_programada')?.toString().trim() ?? '',
    responsable_id: formData.get('responsable_id')?.toString().trim() ?? '',
  }

  const supabase = await createClient()
  const { data: entrega, error: errorEntrega } = await supabase
    .from('entregas')
    .select('estado, solicitud_id')
    .eq('id', entregaId)
    .maybeSingle()

  if (errorEntrega || !entrega) {
    return { error: 'Entrega no encontrada.', valores }
  }

  if (entrega.estado !== 'pendiente') {
    return { error: 'Solo se puede reasignar una entrega pendiente.', valores }
  }

  const { error } = await supabase
    .from('entregas')
    .update({
      fecha_programada: valores.fecha_programada || null,
      responsable_id: valores.responsable_id || null,
    })
    .eq('id', entregaId)

  if (error) {
    return { error: 'No se pudo actualizar la asignación.', valores }
  }

  revalidatePath(`/solicitudes/${entrega.solicitud_id}`)
  revalidatePath('/entregas')
}

export type ReprogramarFormState =
  | { error?: string; valores: ValoresAsignacionFormulario }
  | undefined

// US-12.05: "la entrega puede ser reprogramada" tras una entrega fallida —
// vuelve a 'pendiente' con nueva fecha (y, opcionalmente, nuevo responsable).
export async function reprogramarEntrega(
  entregaId: string,
  _prevState: ReprogramarFormState,
  formData: FormData
): Promise<ReprogramarFormState> {
  await requireRole([...ROLES_LOGISTICA])

  const valores: ValoresAsignacionFormulario = {
    fecha_programada: formData.get('fecha_programada')?.toString().trim() ?? '',
    responsable_id: formData.get('responsable_id')?.toString().trim() ?? '',
  }

  if (!valores.fecha_programada) {
    return { error: 'Ingresa la nueva fecha programada.', valores }
  }

  const supabase = await createClient()
  const { data: entrega, error: errorEntrega } = await supabase
    .from('entregas')
    .select('estado, solicitud_id')
    .eq('id', entregaId)
    .maybeSingle()

  if (errorEntrega || !entrega) {
    return { error: 'Entrega no encontrada.', valores }
  }

  if (entrega.estado !== 'fallida') {
    return { error: 'Solo se puede reprogramar una entrega fallida.', valores }
  }

  const { error } = await supabase
    .from('entregas')
    .update({
      estado: 'pendiente',
      fecha_programada: valores.fecha_programada,
      responsable_id: valores.responsable_id || null,
    })
    .eq('id', entregaId)

  if (error) {
    return { error: mensajeErrorBeneficio(error.message) ?? 'No se pudo reprogramar la entrega.', valores }
  }

  revalidatePath(`/solicitudes/${entrega.solicitud_id}`)
  revalidatePath('/entregas')
}

type ValoresRealizadaFormulario = {
  fecha_hora: string
  receptor_nombre: string
  receptor_relacion: string
  observacion: string
}

export type RealizadaFormState =
  | { error?: string; valores: ValoresRealizadaFormulario }
  | undefined

// US-12.04: "es obligatorio registrar receptor" · "es obligatorio adjuntar
// evidencia si la ayuda lo requiere" (tipos_ayuda.requiere_evidencia,
// US-06.02) · "la solicitud asociada cambia a entregada o cerrada según
// flujo" (rpc marcar_solicitud_entregada) · "la acción queda auditada"
// (trigger de entregas_historial sobre el cambio de estado).
export async function registrarEntregaRealizada(
  entregaId: string,
  _prevState: RealizadaFormState,
  formData: FormData
): Promise<RealizadaFormState> {
  const profile = await requireRole([...ROLES_TERRENO])

  const valores: ValoresRealizadaFormulario = {
    fecha_hora: formData.get('fecha_hora')?.toString().trim() ?? '',
    receptor_nombre: formData.get('receptor_nombre')?.toString().trim() ?? '',
    receptor_relacion: formData.get('receptor_relacion')?.toString().trim() ?? '',
    observacion: formData.get('observacion')?.toString().trim() ?? '',
  }
  const latitudRaw = formData.get('latitud')?.toString().trim() ?? ''
  const longitudRaw = formData.get('longitud')?.toString().trim() ?? ''

  if (!valores.receptor_nombre) {
    return { error: 'El nombre de quien recibe es obligatorio.', valores }
  }

  const entrega = await obtenerEntregaAsignadaAlUsuario(
    entregaId,
    profile.id,
    tieneRol(profile, ['administrador'])
  )
  if (!entrega) {
    return { error: 'Entrega no encontrada o no asignada a tu usuario.', valores }
  }
  if (entrega.estado !== 'pendiente') {
    return { error: 'Solo se puede registrar el resultado de una entrega pendiente.', valores }
  }
  // MR-07: antes de subir la evidencia de una entrega que se va a rechazar.
  if (!(await tieneSalidaStock(entrega.solicitud_id, entrega.periodo))) {
    return { error: MENSAJE_SIN_SALIDA_STOCK, valores }
  }

  const solicitud = await obtenerSolicitud(entrega.solicitud_id)
  const tipoAyuda = solicitud ? await obtenerTipoAyuda(solicitud.tipo_ayuda_id) : null

  const archivo = formData.get('archivo')
  const tieneArchivo = archivo instanceof File && archivo.size > 0

  if (tipoAyuda?.requiere_evidencia && !tieneArchivo) {
    if (!(await tieneEvidenciaPrevia(entrega.solicitud_id, entrega.periodo))) {
      return { error: 'Esta ayuda requiere adjuntar evidencia fotográfica.', valores }
    }
  }

  if (tieneArchivo) {
    const resultadoSubida = await subirDocumentoSolicitud(entrega.solicitud_id, undefined, formData)
    if (resultadoSubida?.error) {
      return { error: resultadoSubida.error, valores }
    }
  }

  const supabase = await createClient()
  const { error: errorUpdate } = await supabase
    .from('entregas')
    .update({
      estado: 'realizada',
      fecha_hora_entrega: valores.fecha_hora ? new Date(valores.fecha_hora).toISOString() : new Date().toISOString(),
      // EPIC 27 (US-27.05): `capturado_en` es el momento real del registro,
      // independiente de `fecha_hora_entrega` (que el usuario puede editar
      // libremente) — lo usa la ruta de sincronización offline para decidir
      // conflictos ("última escritura por captura gana"). El camino online
      // siempre captura en el instante del submit.
      capturado_en: new Date().toISOString(),
      receptor_nombre: valores.receptor_nombre,
      receptor_relacion: valores.receptor_relacion || null,
      observacion_entrega: valores.observacion || null,
      latitud: latitudRaw ? Number(latitudRaw) : null,
      longitud: longitudRaw ? Number(longitudRaw) : null,
    })
    .eq('id', entregaId)

  if (errorUpdate) {
    return {
      error: errorUpdate.message?.includes(ERROR_SIN_SALIDA_STOCK)
        ? MENSAJE_SIN_SALIDA_STOCK
        : (mensajeErrorBeneficio(errorUpdate.message) ?? 'No se pudo registrar la entrega.'),
      valores,
    }
  }

  await supabase.rpc('marcar_solicitud_entregada', { p_solicitud_id: entrega.solicitud_id })

  revalidatePath(`/mis-entregas/${entregaId}`)
  revalidatePath('/mis-entregas')
  revalidatePath(`/solicitudes/${entrega.solicitud_id}`)
}

type ValoresFallidaFormulario = { motivo_fallo: string; observacion: string }

export type FallidaFormState =
  | { error?: string; valores: ValoresFallidaFormulario }
  | undefined

// US-12.05: "es obligatorio seleccionar motivo" · "se puede agregar
// observación" · "la acción queda en historial".
export async function registrarEntregaFallida(
  entregaId: string,
  _prevState: FallidaFormState,
  formData: FormData
): Promise<FallidaFormState> {
  const profile = await requireRole([...ROLES_TERRENO])

  const valores: ValoresFallidaFormulario = {
    motivo_fallo: formData.get('motivo_fallo')?.toString().trim() ?? '',
    observacion: formData.get('observacion')?.toString().trim() ?? '',
  }

  // US-19.03: "la vista de terreno usa estos motivos" — el motivo debe
  // existir y estar activo en el catálogo (mismo criterio server-side que
  // documentos.tipo_documento en subirDocumento, lib/documentos/actions.ts).
  const motivo = valores.motivo_fallo ? await obtenerMotivoEntregaFallida(valores.motivo_fallo) : null
  if (!motivo || motivo.estado !== 'activo') {
    return { error: 'Selecciona un motivo válido.', valores }
  }

  const entrega = await obtenerEntregaAsignadaAlUsuario(
    entregaId,
    profile.id,
    tieneRol(profile, ['administrador'])
  )
  if (!entrega) {
    return { error: 'Entrega no encontrada o no asignada a tu usuario.', valores }
  }
  if (entrega.estado !== 'pendiente') {
    return { error: 'Solo se puede registrar el resultado de una entrega pendiente.', valores }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('entregas')
    .update({
      estado: 'fallida',
      motivo_fallo: valores.motivo_fallo,
      observacion_fallo: valores.observacion || null,
      capturado_en: new Date().toISOString(),
    })
    .eq('id', entregaId)

  if (error) {
    return { error: 'No se pudo registrar la entrega fallida.', valores }
  }

  revalidatePath(`/mis-entregas/${entregaId}`)
  revalidatePath('/mis-entregas')
  revalidatePath(`/solicitudes/${entrega.solicitud_id}`)
}

type ValoresEntregaLocalFormulario = {
  fecha_hora: string
  receptor_nombre: string
  receptor_relacion: string
  observacion: string
}

export type EntregaLocalFormState =
  | { error?: string; valores: ValoresEntregaLocalFormulario }
  | undefined

const ERRORES_ENTREGA_LOCAL: Record<string, string> = {
  RECEPTOR_OBLIGATORIO: 'El nombre de quien recibe es obligatorio.',
  SOLICITUD_NO_ENCONTRADA: 'Solicitud no encontrada.',
  SOLICITUD_NO_APROBADA: 'Solo se puede entregar una solicitud aprobada.',
  NO_PERMITE_ENTREGA_LOCAL: 'Este tipo de ayuda no permite entrega en local.',
  ENTREGA_YA_REALIZADA: 'Esta solicitud ya tiene una entrega realizada.',
  [ERROR_SIN_SALIDA_STOCK]: MENSAJE_SIN_SALIDA_STOCK,
}

// MR-06: entrega en local, en un solo paso. Las reglas (rol, solicitud
// aprobada, tipo de ayuda que permite entrega en local, entrega no realizada)
// las valida registrar_entrega_local() en la base; aquí se revisan antes
// solo para no subir la evidencia de una entrega que se va a rechazar. Si
// había una entrega a domicilio pendiente o fallida, la misma entrega pasa
// a "en local" (la persona vino a retirarla). MR-08: en un beneficio
// periódico es la entrega de un período, aunque el beneficio sea a domicilio.
export async function registrarEntregaLocal(
  solicitudId: string,
  periodo: string | null,
  _prevState: EntregaLocalFormState,
  formData: FormData
): Promise<EntregaLocalFormState> {
  await requireRole([...ROLES_ENTREGA_LOCAL])

  const valores: ValoresEntregaLocalFormulario = {
    fecha_hora: formData.get('fecha_hora')?.toString().trim() ?? '',
    receptor_nombre: formData.get('receptor_nombre')?.toString().trim() ?? '',
    receptor_relacion: formData.get('receptor_relacion')?.toString().trim() ?? '',
    observacion: formData.get('observacion')?.toString().trim() ?? '',
  }

  if (!valores.receptor_nombre) {
    return { error: ERRORES_ENTREGA_LOCAL.RECEPTOR_OBLIGATORIO, valores }
  }

  const solicitud = await obtenerSolicitud(solicitudId)
  if (!solicitud) {
    return { error: ERRORES_ENTREGA_LOCAL.SOLICITUD_NO_ENCONTRADA, valores }
  }
  if (!ESTADOS_SOLICITUD_PARA_ENTREGA.includes(solicitud.estado)) {
    return { error: ERRORES_ENTREGA_LOCAL.SOLICITUD_NO_APROBADA, valores }
  }
  const tipoAyuda = await obtenerTipoAyuda(solicitud.tipo_ayuda_id)
  if (!tipoAyuda?.requiere_entrega || !tipoAyuda.permite_entrega_local) {
    return { error: ERRORES_ENTREGA_LOCAL.NO_PERMITE_ENTREGA_LOCAL, valores }
  }
  if (!(await tieneSalidaStock(solicitudId, periodo))) {
    return { error: MENSAJE_SIN_SALIDA_STOCK, valores }
  }

  // Misma regla de evidencia que la entrega a domicilio (US-12.04).
  const archivo = formData.get('archivo')
  const tieneArchivo = archivo instanceof File && archivo.size > 0
  if (tipoAyuda.requiere_evidencia && !tieneArchivo && !(await tieneEvidenciaPrevia(solicitudId, periodo))) {
    return { error: 'Esta ayuda requiere adjuntar evidencia fotográfica.', valores }
  }
  if (tieneArchivo) {
    const resultadoSubida = await subirDocumentoSolicitud(solicitudId, undefined, formData)
    if (resultadoSubida?.error) {
      return { error: resultadoSubida.error, valores }
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('registrar_entrega_local', {
    p_solicitud_id: solicitudId,
    p_periodo: periodo,
    p_fecha_hora: valores.fecha_hora ? new Date(valores.fecha_hora).toISOString() : null,
    p_receptor_nombre: valores.receptor_nombre,
    p_receptor_relacion: valores.receptor_relacion,
    p_observacion: valores.observacion,
  })

  if (error) {
    const codigo = Object.keys(ERRORES_ENTREGA_LOCAL).find((clave) => error.message?.includes(clave))
    return {
      error: codigo
        ? ERRORES_ENTREGA_LOCAL[codigo]
        : (mensajeErrorBeneficio(error.message) ?? 'No se pudo registrar la entrega.'),
      valores,
    }
  }

  revalidatePath(`/solicitudes/${solicitudId}`)
  revalidatePath(`/hogares/${solicitud.grupo_familiar_id}`)
  revalidatePath('/entregas')
}
