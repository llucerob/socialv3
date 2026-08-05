'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'
import { obtenerTipoAyuda } from '@/lib/ayudas/dal'
import { obtenerGrupoFamiliar } from '@/lib/hogares/dal'
import { superaUmbralElegibilidad, UMBRAL_ELEGIBILIDAD_RSH } from '@/lib/hogares/rsh'
import {
  calcularTopeReembolsoGeneral,
  calcularAcumuladoDialisisMensual,
  calcularRemanenteReembolsoAnual,
} from '@/lib/reembolsos/dal'
import {
  NOMBRE_TIPO_AYUDA_REEMBOLSO_GENERAL,
  NOMBRE_TIPO_AYUDA_REEMBOLSO_DIALISIS,
  NOMBRES_TIPO_AYUDA_REEMBOLSO_EXCEPCIONAL,
  TOPE_ANUAL_POR_GRUPO_FAMILIAR,
  TOPE_MENSUAL_DIALISIS,
} from '@/lib/reembolsos/tramos'
import { listarInformesSocialesDeSolicitud } from '@/lib/informes-sociales/dal'

// US-09.01/09.02: "solo rol aprobador puede aprobar/rechazar" — igual que el
// resto del proyecto, administrador actúa como superusuario junto al rol
// principal. evaluador_social NO puede decidir (a diferencia de otras
// tablas de EPIC 07/08).
const ROLES_APROBACION = ['administrador', 'aprobador'] as const
// US-15.05: "solo rol autorizado puede aprobar excepción" — el sistema no
// tiene un rol distinto de "aprobador especial"; se restringe a
// administrador (el superusuario del sistema), más estricto que la
// aprobación normal, para una excepción que salta un tope monetario fijo.
const ROLES_EXCEPCION_DIALISIS = ['administrador'] as const
// US-05.05: "solo roles autorizados (aprobador/administrador) pueden
// registrar la excepción" — a diferencia de la excepción de diálisis, aquí
// el backlog nombra explícitamente a aprobador, no solo administrador.
const ROLES_EXCEPCION_RSH = ['administrador', 'aprobador'] as const

type ValoresDecisionFormulario = {
  comentario: string
  monto_aprobado: string
  cantidad_aprobada: string
}

export type DecisionFormState =
  | { error?: string; valores: ValoresDecisionFormulario }
  | undefined

type ContextoValido = {
  tipoAyudaId: string
  montoSolicitado: number | null
  grupoFamiliarId: string
  fechaSolicitud: string
  personaId: string | null
  tramoRsh: number | null
}

// US-09.01: "la solicitud debe estar en evaluación o lista para aprobación"
// — el estado enum no tiene un valor separado para "lista para aprobación",
// así que se interpreta como el mismo estado "en_evaluacion".
// Dependencia US-08.01: no se puede decidir sin al menos una evaluación
// social registrada primero.
type ResultadoValidacion =
  | { ok: false; error: string }
  | { ok: true; contexto: ContextoValido }

async function validarContexto(solicitudId: string): Promise<ResultadoValidacion> {
  const supabase = await createClient()
  const { data: solicitud, error } = await supabase
    .from('solicitudes')
    .select('estado, tipo_ayuda_id, monto_solicitado, grupo_familiar_id, fecha_solicitud, persona_id')
    .eq('id', solicitudId)
    .maybeSingle()

  if (error || !solicitud) {
    return { ok: false, error: 'Solicitud no encontrada.' }
  }

  if (solicitud.estado !== 'en_evaluacion') {
    return { ok: false, error: 'Solo se puede decidir sobre una solicitud en evaluación.' }
  }

  const { count, error: errorConteo } = await supabase
    .from('evaluaciones_sociales')
    .select('id', { count: 'exact', head: true })
    .eq('solicitud_id', solicitudId)

  if (errorConteo || !count) {
    return { ok: false, error: 'No se puede decidir sin al menos una evaluación social registrada.' }
  }

  const hogar = await obtenerGrupoFamiliar(solicitud.grupo_familiar_id)

  return {
    ok: true,
    contexto: {
      tipoAyudaId: solicitud.tipo_ayuda_id,
      montoSolicitado: solicitud.monto_solicitado,
      grupoFamiliarId: solicitud.grupo_familiar_id,
      fechaSolicitud: solicitud.fecha_solicitud,
      personaId: solicitud.persona_id,
      tramoRsh: hogar?.tramo_rsh ?? null,
    },
  }
}

// US-09.03: para ayudas de tipo 'reembolso' se exige monto_aprobado (sin
// superar monto_solicitado); para ayudas físicas se exige cantidad_aprobada
// (texto libre). US-14.03/14.06: para reembolso médico general, además, el
// monto aprobado tampoco puede superar el tope calculado por US-14.05 (el
// menor entre el tramo teórico y el remanente anual compartido — ver
// lib/reembolsos/dal.ts, fuente única reutilizable por EPIC 25 cuando
// exista). El tope mensual de diálisis (EPIC 15) sigue sin implementarse.
export async function aprobarSolicitud(
  solicitudId: string,
  _prevState: DecisionFormState,
  formData: FormData
): Promise<DecisionFormState> {
  await requireRole([...ROLES_APROBACION])

  const supabase = await createClient()

  const comentario = formData.get('comentario')?.toString().trim() || null
  const montoRaw = formData.get('monto_aprobado')?.toString().trim() ?? ''
  const cantidadRaw = formData.get('cantidad_aprobada')?.toString().trim() ?? ''
  const valores = { comentario: comentario ?? '', monto_aprobado: montoRaw, cantidad_aprobada: cantidadRaw }

  const validacion = await validarContexto(solicitudId)
  if (!validacion.ok) {
    return { error: validacion.error, valores }
  }

  // US-05.04/US-05.05: "el sistema bloquea la aprobación regular y exige que
  // la solicitud se marque como excepción" — CLAUDE.md es explícito en que
  // el bloqueo es sobre la APROBACIÓN, no sobre poder evaluar (por eso
  // enviarAEvaluacion, lib/solicitudes/actions.ts, ya no bloquea el envío a
  // evaluación por RSH — solo lo audita). El único camino para aprobar aquí
  // es aprobarExcepcionRsh, más abajo.
  if (superaUmbralElegibilidad(validacion.contexto.tramoRsh)) {
    return {
      error: `Este hogar tiene un tramo RSH de ${validacion.contexto.tramoRsh}%, superior al ${UMBRAL_ELEGIBILIDAD_RSH}% permitido para el flujo regular. Requiere una excepción (US-05.05), con un informe social asociado.`,
      valores,
    }
  }

  const tipoAyuda = await obtenerTipoAyuda(validacion.contexto.tipoAyudaId)
  if (!tipoAyuda) {
    return { error: 'Tipo de ayuda no encontrado.', valores }
  }

  let montoAprobado: number | null = null
  let cantidadAprobada: string | null = null

  if (tipoAyuda.tipo === 'reembolso') {
    if (!montoRaw) {
      return { error: 'Debes ingresar el monto aprobado.', valores }
    }
    montoAprobado = Number(montoRaw)
    if (Number.isNaN(montoAprobado) || montoAprobado < 0) {
      return { error: 'El monto aprobado debe ser un número válido.', valores }
    }
    if (
      validacion.contexto.montoSolicitado !== null &&
      montoAprobado > validacion.contexto.montoSolicitado
    ) {
      return {
        error: `El monto aprobado no puede superar el monto solicitado ($${validacion.contexto.montoSolicitado.toLocaleString('es-CL')}).`,
        valores,
      }
    }

    // US-14.06: bloqueo del tope calculado, exclusivo de reembolso médico
    // general (no diálisis ni ayudas físicas).
    if (tipoAyuda.nombre === NOMBRE_TIPO_AYUDA_REEMBOLSO_GENERAL) {
      const anio = Number(validacion.contexto.fechaSolicitud.slice(0, 4))
      const tope = await calcularTopeReembolsoGeneral(validacion.contexto.grupoFamiliarId, anio)

      if (tope.bloqueadoPorTramos || tope.remanenteAnual <= 0) {
        const motivo =
          tope.remanenteAnual <= 0
            ? `pool anual agotado: el hogar ya usó los $${TOPE_ANUAL_POR_GRUPO_FAMILIAR.toLocaleString('es-CL')} disponibles este ${anio}`
            : `el hogar ya tiene ${tope.numeroReembolso - 1} reembolsos generales aprobados en ${anio} (máximo 4)`
        await supabase.rpc('registrar_bloqueo_tope_reembolso', {
          p_solicitud_id: solicitudId,
          p_motivo: `bloqueada: ${motivo}`,
        })
        return {
          error: `No se puede aprobar un nuevo reembolso general: ${motivo}.`,
          valores,
        }
      }

      if (montoAprobado > tope.topeFinal) {
        await supabase.rpc('registrar_bloqueo_tope_reembolso', {
          p_solicitud_id: solicitudId,
          p_motivo: `bloqueada: monto solicitado ($${montoAprobado.toLocaleString('es-CL')}) supera el tope calculado ($${tope.topeFinal.toLocaleString('es-CL')}) para el ${tope.numeroReembolso}º reembolso del año`,
        })
        return {
          error: `El monto aprobado no puede superar el tope calculado para el ${tope.numeroReembolso}º reembolso de este año: $${tope.topeFinal.toLocaleString('es-CL')} (tramo $${tope.topeTramo.toLocaleString('es-CL')}, remanente anual $${tope.remanenteAnual.toLocaleString('es-CL')}).`,
          valores,
        }
      }
    }

    // US-15.04: "el sistema valida acumulado antes de aprobar" · "si el
    // monto supera $150.000 mensual, no se permite aprobación normal" · "el
    // sistema informa monto disponible restante" · "la validación queda
    // registrada" (misma rpc de auditoría que el bloqueo de reembolso
    // general — el campo es genérico, 'tope_reembolso', no específico de un
    // solo tipo de ayuda). El único camino para superar este tope es
    // aprobarExcepcionDialisis (US-15.05, solo administrador).
    if (tipoAyuda.nombre === NOMBRE_TIPO_AYUDA_REEMBOLSO_DIALISIS && validacion.contexto.personaId) {
      const [anioDialisis, mesDialisis] = validacion.contexto.fechaSolicitud.split('-').map(Number)
      const { acumuladoMensual, saldoDisponible } = await calcularAcumuladoDialisisMensual(
        validacion.contexto.personaId,
        anioDialisis,
        mesDialisis
      )

      if (montoAprobado > saldoDisponible) {
        const motivo = `monto aprobado ($${montoAprobado.toLocaleString('es-CL')}) supera el saldo mensual disponible ($${saldoDisponible.toLocaleString('es-CL')} de $${TOPE_MENSUAL_DIALISIS.toLocaleString('es-CL')}, acumulado $${acumuladoMensual.toLocaleString('es-CL')})`
        await supabase.rpc('registrar_bloqueo_tope_reembolso', {
          p_solicitud_id: solicitudId,
          p_motivo: `bloqueada: ${motivo}`,
        })
        return {
          error: `No se puede aprobar por la vía normal: ${motivo}. Requiere una excepción (US-15.05).`,
          valores,
        }
      }
    }

    // US-25.01/25.03/25.04/25.05: reembolso excepcional (cirugía o
    // fallecimiento) — "exige informe social asociado" (mismo criterio que
    // la excepción RSH, ver aprobarExcepcionRsh más abajo) y "el monto
    // aprobado no puede superar el remanente calculado" (US-25.02, fuente
    // única compartida con el reembolso general — sin vía de excepción a
    // diferencia de diálisis, el backlog no la contempla).
    if ((NOMBRES_TIPO_AYUDA_REEMBOLSO_EXCEPCIONAL as readonly string[]).includes(tipoAyuda.nombre)) {
      const informes = await listarInformesSocialesDeSolicitud(solicitudId)
      if (informes.length === 0) {
        return {
          error: 'No se puede aprobar sin un informe social asociado a esta solicitud.',
          valores,
        }
      }

      const anioExcepcional = Number(validacion.contexto.fechaSolicitud.slice(0, 4))
      const remanenteAnual = await calcularRemanenteReembolsoAnual(
        validacion.contexto.grupoFamiliarId,
        anioExcepcional
      )

      if (montoAprobado > remanenteAnual) {
        const motivo = `monto aprobado ($${montoAprobado.toLocaleString('es-CL')}) supera el remanente anual disponible del hogar ($${remanenteAnual.toLocaleString('es-CL')} de $${TOPE_ANUAL_POR_GRUPO_FAMILIAR.toLocaleString('es-CL')})`
        await supabase.rpc('registrar_bloqueo_tope_reembolso', {
          p_solicitud_id: solicitudId,
          p_motivo: `bloqueada: ${motivo}`,
        })
        return {
          error: `No se puede aprobar: ${motivo}.`,
          valores,
        }
      }
    }
  } else {
    if (!cantidadRaw) {
      return { error: 'Debes ingresar la cantidad o detalle aprobado.', valores }
    }
    cantidadAprobada = cantidadRaw
  }

  const { error: errorInsert } = await supabase.from('decisiones_solicitud').insert({
    solicitud_id: solicitudId,
    decision: 'aprobada',
    comentario,
    monto_aprobado: montoAprobado,
    cantidad_aprobada: cantidadAprobada,
  })

  if (errorInsert) {
    return { error: 'No se pudo registrar la decisión.', valores }
  }

  const { error: errorUpdate } = await supabase
    .from('solicitudes')
    .update({ estado: 'aprobada' })
    .eq('id', solicitudId)

  if (errorUpdate) {
    return {
      error: 'La decisión se guardó pero no se pudo actualizar el estado de la solicitud.',
      valores,
    }
  }

  revalidatePath(`/solicitudes/${solicitudId}`)
  revalidatePath('/solicitudes')
}

type ValoresExcepcionDialisisFormulario = {
  motivo: string
  monto_aprobado: string
}

export type ExcepcionDialisisFormState =
  | { error?: string; valores: ValoresExcepcionDialisisFormulario }
  | undefined

// US-15.05: "autorizar excepcionalmente un monto superior al tope" — solo
// administrador (ver ROLES_EXCEPCION_DIALISIS) · "se exige motivo escrito"
// (comentario obligatorio, a diferencia de la aprobación normal donde es
// opcional) · "se registra usuario, fecha y fundamento" (decisiones_solicitud
// ya audita aprobador_id/created_at/comentario, sin columnas nuevas) · "la
// excepción aparece en auditoría y reportes" — se logra dejando la
// solicitud en 'aprobada_excepcion' (no 'aprobada'), el mismo estado
// distintivo ya reservado en el enum para excepciones (EPIC 05/23,
// CLAUDE.md: "las excepciones nunca se ocultan"), así que cualquier vista
// que ya muestre el estado de la solicitud marca la excepción sin trabajo
// adicional.
export async function aprobarExcepcionDialisis(
  solicitudId: string,
  _prevState: ExcepcionDialisisFormState,
  formData: FormData
): Promise<ExcepcionDialisisFormState> {
  await requireRole([...ROLES_EXCEPCION_DIALISIS])

  const supabase = await createClient()

  const motivo = formData.get('motivo')?.toString().trim() ?? ''
  const montoRaw = formData.get('monto_aprobado')?.toString().trim() ?? ''
  const valores = { motivo, monto_aprobado: montoRaw }

  if (!motivo) {
    return { error: 'El motivo de la excepción es obligatorio.', valores }
  }

  const validacion = await validarContexto(solicitudId)
  if (!validacion.ok) {
    return { error: validacion.error, valores }
  }

  const tipoAyuda = await obtenerTipoAyuda(validacion.contexto.tipoAyudaId)
  if (tipoAyuda?.nombre !== NOMBRE_TIPO_AYUDA_REEMBOLSO_DIALISIS) {
    return { error: 'Esta acción solo aplica a solicitudes de reembolso por diálisis.', valores }
  }

  if (!montoRaw) {
    return { error: 'Debes ingresar el monto aprobado.', valores }
  }
  const montoAprobado = Number(montoRaw)
  if (Number.isNaN(montoAprobado) || montoAprobado < 0) {
    return { error: 'El monto aprobado debe ser un número válido.', valores }
  }
  if (
    validacion.contexto.montoSolicitado !== null &&
    montoAprobado > validacion.contexto.montoSolicitado
  ) {
    return {
      error: `El monto aprobado no puede superar el monto solicitado ($${validacion.contexto.montoSolicitado.toLocaleString('es-CL')}).`,
      valores,
    }
  }

  const { error: errorInsert } = await supabase.from('decisiones_solicitud').insert({
    solicitud_id: solicitudId,
    decision: 'aprobada',
    comentario: motivo,
    monto_aprobado: montoAprobado,
  })

  if (errorInsert) {
    return { error: 'No se pudo registrar la decisión.', valores }
  }

  const { error: errorUpdate } = await supabase
    .from('solicitudes')
    .update({ estado: 'aprobada_excepcion' })
    .eq('id', solicitudId)

  if (errorUpdate) {
    return {
      error: 'La decisión se guardó pero no se pudo actualizar el estado de la solicitud.',
      valores,
    }
  }

  revalidatePath(`/solicitudes/${solicitudId}`)
  revalidatePath('/solicitudes')
}

type ValoresExcepcionRshFormulario = {
  motivo: string
  autoridad_solicitante: string
  monto_aprobado: string
  cantidad_aprobada: string
}

export type ExcepcionRshFormState =
  | { error?: string; valores: ValoresExcepcionRshFormulario }
  | undefined

// US-05.05: "registrar excepción cuando el hogar supere el 40% RSH... sin
// ocultar que se trata de un caso excepcional" · "el motivo... es
// obligatorio y de texto libre" · "autoridad o unidad que la solicita" es
// campo propio (autoridad_solicitante, ver migración) · "la excepción no
// puede aprobarse sin un informe social asociado" (US-23.01) — a diferencia
// de aprobarExcepcionDialisis (solo reembolso), una excepción RSH puede
// aplicar a cualquier tipo de ayuda, así que reutiliza la misma rama
// monto/cantidad de aprobarSolicitud. No cruza el tope anual de reembolsos
// (US-14.05/US-25.02) ni el tope mensual de diálisis (EPIC 15): son ejes de
// excepción independientes — esta solo levanta el bloqueo de elegibilidad
// RSH, no los topes monetarios.
export async function aprobarExcepcionRsh(
  solicitudId: string,
  _prevState: ExcepcionRshFormState,
  formData: FormData
): Promise<ExcepcionRshFormState> {
  await requireRole([...ROLES_EXCEPCION_RSH])

  const supabase = await createClient()

  const motivo = formData.get('motivo')?.toString().trim() ?? ''
  const autoridadSolicitante = formData.get('autoridad_solicitante')?.toString().trim() ?? ''
  const montoRaw = formData.get('monto_aprobado')?.toString().trim() ?? ''
  const cantidadRaw = formData.get('cantidad_aprobada')?.toString().trim() ?? ''
  const valores = {
    motivo,
    autoridad_solicitante: autoridadSolicitante,
    monto_aprobado: montoRaw,
    cantidad_aprobada: cantidadRaw,
  }

  if (!motivo) {
    return { error: 'El motivo de la excepción es obligatorio.', valores }
  }
  if (!autoridadSolicitante) {
    return { error: 'La autoridad o unidad que solicita la excepción es obligatoria.', valores }
  }

  const validacion = await validarContexto(solicitudId)
  if (!validacion.ok) {
    return { error: validacion.error, valores }
  }

  if (!superaUmbralElegibilidad(validacion.contexto.tramoRsh)) {
    return { error: 'Esta acción solo aplica a hogares que superan el umbral de elegibilidad RSH.', valores }
  }

  // US-23.01: "no se puede aprobar una excepción RSH sin un informe social
  // asociado" — asociado a ESTA solicitud específicamente (US-23.03: "la
  // referencia es visible desde ambos lados"), no a cualquier informe del
  // hogar en general.
  const informes = await listarInformesSocialesDeSolicitud(solicitudId)
  if (informes.length === 0) {
    return {
      error: 'No se puede aprobar la excepción sin un informe social asociado a esta solicitud.',
      valores,
    }
  }

  const tipoAyuda = await obtenerTipoAyuda(validacion.contexto.tipoAyudaId)
  if (!tipoAyuda) {
    return { error: 'Tipo de ayuda no encontrado.', valores }
  }

  let montoAprobado: number | null = null
  let cantidadAprobada: string | null = null

  if (tipoAyuda.tipo === 'reembolso') {
    if (!montoRaw) {
      return { error: 'Debes ingresar el monto aprobado.', valores }
    }
    montoAprobado = Number(montoRaw)
    if (Number.isNaN(montoAprobado) || montoAprobado < 0) {
      return { error: 'El monto aprobado debe ser un número válido.', valores }
    }
    if (
      validacion.contexto.montoSolicitado !== null &&
      montoAprobado > validacion.contexto.montoSolicitado
    ) {
      return {
        error: `El monto aprobado no puede superar el monto solicitado ($${validacion.contexto.montoSolicitado.toLocaleString('es-CL')}).`,
        valores,
      }
    }
  } else {
    if (!cantidadRaw) {
      return { error: 'Debes ingresar la cantidad o detalle aprobado.', valores }
    }
    cantidadAprobada = cantidadRaw
  }

  const { error: errorInsert } = await supabase.from('decisiones_solicitud').insert({
    solicitud_id: solicitudId,
    decision: 'aprobada',
    comentario: motivo,
    autoridad_solicitante: autoridadSolicitante,
    monto_aprobado: montoAprobado,
    cantidad_aprobada: cantidadAprobada,
  })

  if (errorInsert) {
    return { error: 'No se pudo registrar la decisión.', valores }
  }

  const { error: errorUpdate } = await supabase
    .from('solicitudes')
    .update({ estado: 'aprobada_excepcion' })
    .eq('id', solicitudId)

  if (errorUpdate) {
    return {
      error: 'La decisión se guardó pero no se pudo actualizar el estado de la solicitud.',
      valores,
    }
  }

  revalidatePath(`/solicitudes/${solicitudId}`)
  revalidatePath('/solicitudes')
}

// US-09.02: "el rechazo exige motivo" · "el historial mantiene la
// evaluación previa" (las evaluaciones_sociales nunca se eliminan, así que
// esto se cumple automáticamente).
export async function rechazarSolicitud(
  solicitudId: string,
  _prevState: DecisionFormState,
  formData: FormData
): Promise<DecisionFormState> {
  await requireRole([...ROLES_APROBACION])

  const comentario = formData.get('comentario')?.toString().trim() ?? ''
  const valores = { comentario, monto_aprobado: '', cantidad_aprobada: '' }

  if (!comentario) {
    return { error: 'El motivo de rechazo es obligatorio.', valores }
  }

  const validacion = await validarContexto(solicitudId)
  if (!validacion.ok) {
    return { error: validacion.error, valores }
  }

  const supabase = await createClient()
  const { error: errorInsert } = await supabase.from('decisiones_solicitud').insert({
    solicitud_id: solicitudId,
    decision: 'rechazada',
    comentario,
  })

  if (errorInsert) {
    return { error: 'No se pudo registrar la decisión.', valores }
  }

  const { error: errorUpdate } = await supabase
    .from('solicitudes')
    .update({ estado: 'rechazada' })
    .eq('id', solicitudId)

  if (errorUpdate) {
    return {
      error: 'La decisión se guardó pero no se pudo actualizar el estado de la solicitud.',
      valores,
    }
  }

  revalidatePath(`/solicitudes/${solicitudId}`)
  revalidatePath('/solicitudes')
}
