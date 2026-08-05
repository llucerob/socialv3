'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'
import { TIPOS_INCIDENTE, type TipoIncidenteSeguridad } from './types'

// US-26.01/26.03/26.04: no existe un rol "encargado de seguridad de la
// información" en RolUsuario — todas las acciones de escritura de EPIC 26
// quedan en administrador (único rol nombrado en las 3 historias).
const ROLES_GESTION_INCIDENTES = ['administrador'] as const

function esTipoIncidenteValido(valor: string): valor is TipoIncidenteSeguridad {
  return (TIPOS_INCIDENTE as string[]).includes(valor)
}

type ValoresIncidenteFormulario = {
  fecha_incidente: string
  usuario_involucrado_id: string
  tipo: string
  datos_afectados: string
  cantidad_personas_afectadas: string
  medidas_correctivas: string
  responsable_seguimiento_id: string
}

export type IncidenteFormState = { error?: string; valores: ValoresIncidenteFormulario } | undefined

function leerCampos(formData: FormData): ValoresIncidenteFormulario {
  return {
    fecha_incidente: formData.get('fecha_incidente')?.toString() ?? '',
    usuario_involucrado_id: formData.get('usuario_involucrado_id')?.toString() ?? '',
    tipo: formData.get('tipo')?.toString() ?? '',
    datos_afectados: formData.get('datos_afectados')?.toString().trim() ?? '',
    cantidad_personas_afectadas: formData.get('cantidad_personas_afectadas')?.toString().trim() ?? '',
    medidas_correctivas: formData.get('medidas_correctivas')?.toString().trim() ?? '',
    responsable_seguimiento_id: formData.get('responsable_seguimiento_id')?.toString() ?? '',
  }
}

// US-26.01: "se puede registrar un incidente con estos campos mínimos" —
// fecha, tipo (del catálogo), datos afectados, cantidad estimada de
// personas afectadas y responsable de seguimiento son obligatorios; usuario
// involucrado y medidas correctivas quedan opcionales al crear (US-26.03 las
// exige recién al cerrar). "El registro queda auditado" lo cubre la propia
// fila (creado_por/created_at), igual criterio que decisiones_solicitud.
export async function crearIncidente(
  _prevState: IncidenteFormState,
  formData: FormData
): Promise<IncidenteFormState> {
  await requireRole([...ROLES_GESTION_INCIDENTES])

  const campos = leerCampos(formData)

  if (!campos.fecha_incidente || !campos.tipo || !campos.responsable_seguimiento_id) {
    return { error: 'Fecha, tipo de incidente y responsable de seguimiento son obligatorios.', valores: campos }
  }
  if (!esTipoIncidenteValido(campos.tipo)) {
    return { error: 'Tipo de incidente inválido.', valores: campos }
  }
  if (!campos.datos_afectados) {
    return { error: 'Describe los datos afectados.', valores: campos }
  }

  const cantidad = Number(campos.cantidad_personas_afectadas)
  if (!campos.cantidad_personas_afectadas || Number.isNaN(cantidad) || cantidad < 0) {
    return { error: 'La cantidad estimada de personas afectadas debe ser un número válido.', valores: campos }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('incidentes_seguridad')
    .insert({
      fecha_incidente: campos.fecha_incidente,
      usuario_involucrado_id: campos.usuario_involucrado_id || null,
      tipo: campos.tipo,
      datos_afectados: campos.datos_afectados,
      cantidad_personas_afectadas: cantidad,
      medidas_correctivas: campos.medidas_correctivas || null,
      responsable_seguimiento_id: campos.responsable_seguimiento_id,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { error: 'No se pudo registrar el incidente.', valores: campos }
  }

  revalidatePath('/incidentes')
  redirect(`/incidentes/${data.id}`)
}

export type CerrarIncidenteState = { error?: string; medidas_correctivas: string } | undefined

// US-26.03: "se puede cambiar el estado a 'cerrado' solo si existen medidas
// correctivas registradas" — se exigen en el propio formulario de cierre
// (si ya existían, este mismo campo permite confirmarlas/editarlas antes de
// cerrar; no hay una historia de "editar incidente" aparte). "El cierre
// queda auditado" lo cubre el trigger de incidentes_seguridad_historial.
export async function cerrarIncidente(
  id: string,
  _prevState: CerrarIncidenteState,
  formData: FormData
): Promise<CerrarIncidenteState> {
  await requireRole([...ROLES_GESTION_INCIDENTES])

  const medidasCorrectivas = formData.get('medidas_correctivas')?.toString().trim() ?? ''
  if (!medidasCorrectivas) {
    return { error: 'Debes registrar las medidas correctivas antes de cerrar el incidente.', medidas_correctivas: medidasCorrectivas }
  }

  const supabase = await createClient()
  const { data: incidente, error: errorLectura } = await supabase
    .from('incidentes_seguridad')
    .select('estado')
    .eq('id', id)
    .maybeSingle()

  if (errorLectura || !incidente) {
    return { error: 'Incidente no encontrado.', medidas_correctivas: medidasCorrectivas }
  }
  if (incidente.estado === 'cerrado') {
    return { error: 'Este incidente ya está cerrado.', medidas_correctivas: medidasCorrectivas }
  }

  const { error } = await supabase
    .from('incidentes_seguridad')
    .update({ medidas_correctivas: medidasCorrectivas, estado: 'cerrado' })
    .eq('id', id)

  if (error) {
    return { error: 'No se pudo cerrar el incidente.', medidas_correctivas: medidasCorrectivas }
  }

  revalidatePath(`/incidentes/${id}`)
  revalidatePath('/incidentes')
}

type ValoresNotificacionFormulario = {
  notificacion_fecha: string
  notificacion_destinatario: string
  notificacion_responsable_id: string
}

export type NotificarIncidenteState = { error?: string; valores: ValoresNotificacionFormulario } | undefined

// US-26.04: "dejar constancia de si un incidente fue notificado a la
// autoridad o a las personas afectadas... no automatiza el envío de la
// notificación, solo deja registro manual del hecho" — un solo registro por
// incidente (no se pide poder reemplazarlo).
export async function registrarNotificacionIncidente(
  id: string,
  _prevState: NotificarIncidenteState,
  formData: FormData
): Promise<NotificarIncidenteState> {
  await requireRole([...ROLES_GESTION_INCIDENTES])

  const valores: ValoresNotificacionFormulario = {
    notificacion_fecha: formData.get('notificacion_fecha')?.toString() ?? '',
    notificacion_destinatario: formData.get('notificacion_destinatario')?.toString() ?? '',
    notificacion_responsable_id: formData.get('notificacion_responsable_id')?.toString() ?? '',
  }

  if (!valores.notificacion_fecha || !valores.notificacion_destinatario || !valores.notificacion_responsable_id) {
    return { error: 'Fecha, destinatario y responsable de la notificación son obligatorios.', valores }
  }
  if (!['agencia', 'titulares', 'ambos'].includes(valores.notificacion_destinatario)) {
    return { error: 'Destinatario inválido.', valores }
  }

  const supabase = await createClient()
  const { data: incidente, error: errorLectura } = await supabase
    .from('incidentes_seguridad')
    .select('notificacion_fecha')
    .eq('id', id)
    .maybeSingle()

  if (errorLectura || !incidente) {
    return { error: 'Incidente no encontrado.', valores }
  }
  if (incidente.notificacion_fecha) {
    return { error: 'Este incidente ya tiene una notificación registrada.', valores }
  }

  const { error } = await supabase
    .from('incidentes_seguridad')
    .update({
      notificacion_fecha: valores.notificacion_fecha,
      notificacion_destinatario: valores.notificacion_destinatario,
      notificacion_responsable_id: valores.notificacion_responsable_id,
    })
    .eq('id', id)

  if (error) {
    return { error: 'No se pudo registrar la notificación.', valores }
  }

  revalidatePath(`/incidentes/${id}`)
}
