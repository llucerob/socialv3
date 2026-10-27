'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'
import { obtenerGrupoFamiliar } from '@/lib/hogares/dal'
import { UMBRAL_ELEGIBILIDAD_RSH, superaUmbralElegibilidad } from '@/lib/hogares/rsh'
import { obtenerTipoAyuda } from '@/lib/ayudas/dal'
import { obtenerPersona } from '@/lib/personas/dal'
import { contarReembolsosGeneralesAprobados } from '@/lib/reembolsos/dal'
import {
  NOMBRE_TIPO_AYUDA_REEMBOLSO_GENERAL,
  NOMBRE_TIPO_AYUDA_REEMBOLSO_DIALISIS,
  NOMBRE_TIPO_AYUDA_REEMBOLSO_CIRUGIA,
  NOMBRE_TIPO_AYUDA_REEMBOLSO_FALLECIMIENTO,
  NOMBRES_TIPO_AYUDA_REEMBOLSO_EXCEPCIONAL,
  MAX_REEMBOLSOS_GENERALES_POR_ANIO,
  MES_INICIO_VIGENCIA_REEMBOLSO_GENERAL,
  MES_FIN_VIGENCIA_REEMBOLSO_GENERAL,
} from '@/lib/reembolsos/tramos'
import { TIPO_DOCUMENTO_LABELS } from '@/lib/documentos/types'
import type { EstadoSolicitud } from './types'

const ROLES_GESTION_SOLICITUDES = ['administrador', 'evaluador_social'] as const
// US-08.03: "Como evaluador o aprobador, quiero observar una solicitud" —
// a diferencia del resto de acciones de EPIC 07, esta también la puede
// hacer el aprobador.
const ROLES_OBSERVAR_SOLICITUDES = ['administrador', 'evaluador_social', 'aprobador'] as const
const ESTADOS_EDITABLES: EstadoSolicitud[] = ['borrador', 'ingresada']
const ESTADOS_ANULABLES: EstadoSolicitud[] = ['borrador', 'ingresada', 'en_evaluacion']

export type ObservarSolicitudState = { error?: string; motivo?: string } | undefined
export type AnularSolicitudState = { error?: string; motivo?: string } | undefined

type ValoresSolicitudFormulario = {
  tipo_ayuda_id: string
  persona_id: string | null
  fecha_solicitud: string
  motivo: string
  observaciones: string | null
  monto_solicitado: string
}

export type SolicitudFormState =
  | { error?: string; valores: ValoresSolicitudFormulario }
  | undefined

export type EnviarEvaluacionState = { bloqueado?: string } | undefined

function leerCampos(formData: FormData): ValoresSolicitudFormulario {
  return {
    tipo_ayuda_id: formData.get('tipo_ayuda_id')?.toString() ?? '',
    persona_id: formData.get('persona_id')?.toString() || null,
    fecha_solicitud: formData.get('fecha_solicitud')?.toString() ?? '',
    motivo: formData.get('motivo')?.toString().trim() ?? '',
    observaciones: formData.get('observaciones')?.toString().trim() || null,
    monto_solicitado: formData.get('monto_solicitado')?.toString().trim() ?? '',
  }
}

// US-07.01 ("persona obligatoria si la ayuda lo exige") + US-04.04 completo:
// ayudas familiares sin persona obligatoria, personales con selección de
// integrante, validación de pertenencia al hogar. US-04.03: un integrante
// inactivo no cuenta como beneficiario activo.
//
// El chequeo de "activo" (tipo de ayuda / persona) solo se exige cuando esa
// selección es NUEVA (creación, o cambio real al editar). Si una solicitud ya
// tenía asignado un tipo de ayuda o persona que después se desactivó,
// re-exigir "activo" al guardar otros cambios (ej. corregir el motivo)
// dejaría la solicitud sin poder editarse nunca más — un callejón sin salida.
type ValidacionSolicitud =
  | { ok: false; error: string }
  | { ok: true; montoSolicitado: number | null }

// US-09.03: las ayudas de tipo 'reembolso' necesitan un monto solicitado
// para poder validar después que "el monto aprobado no puede superar el
// monto solicitado". Para ayudas físicas queda en null.
async function validarCampos(
  grupoFamiliarId: string,
  campos: ValoresSolicitudFormulario,
  valoresAnteriores?: { tipo_ayuda_id: string; persona_id: string | null }
): Promise<ValidacionSolicitud> {
  if (!campos.tipo_ayuda_id || !campos.fecha_solicitud || !campos.motivo) {
    return { ok: false, error: 'Tipo de ayuda, fecha y motivo son obligatorios.' }
  }

  const tipoAyuda = await obtenerTipoAyuda(campos.tipo_ayuda_id)
  if (!tipoAyuda) {
    return { ok: false, error: 'El tipo de ayuda seleccionado no existe.' }
  }

  const tipoAyudaEsNuevo = campos.tipo_ayuda_id !== valoresAnteriores?.tipo_ayuda_id
  if (tipoAyudaEsNuevo && tipoAyuda.estado !== 'activo') {
    return { ok: false, error: 'El tipo de ayuda seleccionado no está activo.' }
  }

  if (tipoAyuda.requiere_persona_beneficiaria) {
    if (!campos.persona_id) {
      return {
        ok: false,
        error: `"${tipoAyuda.nombre}" requiere seleccionar una persona beneficiaria.`,
      }
    }

    const persona = await obtenerPersona(campos.persona_id)
    if (!persona || persona.grupo_familiar_id !== grupoFamiliarId) {
      return { ok: false, error: 'La persona beneficiaria debe pertenecer a este hogar.' }
    }

    // US-25.04: el "integrante afectado" del reembolso por fallecimiento es,
    // por definición, un integrante fallecido — se permite ese estado
    // además de 'activo' solo para este tipo de ayuda. El resto de tipos de
    // ayuda mantiene la regla original (US-04.03).
    const personaEsNueva = campos.persona_id !== valoresAnteriores?.persona_id
    const estadosPersonaPermitidos =
      tipoAyuda.nombre === NOMBRE_TIPO_AYUDA_REEMBOLSO_FALLECIMIENTO ? ['activo', 'fallecido'] : ['activo']
    if (personaEsNueva && !estadosPersonaPermitidos.includes(persona.estado)) {
      return { ok: false, error: 'La persona beneficiaria seleccionada no está activa.' }
    }
  }

  let montoSolicitado: number | null = null
  if (tipoAyuda.tipo === 'reembolso') {
    if (!campos.monto_solicitado) {
      return { ok: false, error: `"${tipoAyuda.nombre}" requiere ingresar el monto solicitado.` }
    }
    montoSolicitado = Number(campos.monto_solicitado)
    if (Number.isNaN(montoSolicitado) || montoSolicitado < 0) {
      return { ok: false, error: 'El monto solicitado debe ser un número válido.' }
    }

    // US-25.01/25.04: "el monto solicitado debe ser mayor a cero" — criterio
    // propio de los reembolsos excepcionales, no exigido genéricamente al
    // resto de reembolsos (que solo exigen >= 0).
    if (
      (NOMBRES_TIPO_AYUDA_REEMBOLSO_EXCEPCIONAL as readonly string[]).includes(tipoAyuda.nombre) &&
      montoSolicitado <= 0
    ) {
      return { ok: false, error: `"${tipoAyuda.nombre}" requiere un monto solicitado mayor a cero.` }
    }
  }

  // US-14.05 criterio 2: "si el hogar ya tiene 4 reembolsos generales
  // aprobados en el año, el sistema bloquea una nueva solicitud general".
  // Igual que el chequeo de "tipo de ayuda activo": solo se exige cuando el
  // reembolso general es una selección NUEVA (crear, o cambiar el tipo de
  // ayuda al editar) — no al guardar otros cambios de una solicitud ya
  // existente con ese tipo de ayuda.
  if (tipoAyudaEsNuevo && tipoAyuda.nombre === NOMBRE_TIPO_AYUDA_REEMBOLSO_GENERAL) {
    const anio = Number(campos.fecha_solicitud.slice(0, 4))
    const aprobadosEsteAnio = await contarReembolsosGeneralesAprobados(grupoFamiliarId, anio)
    if (aprobadosEsteAnio >= MAX_REEMBOLSOS_GENERALES_POR_ANIO) {
      return {
        ok: false,
        error: `Este hogar ya tiene ${MAX_REEMBOLSOS_GENERALES_POR_ANIO} reembolsos médicos generales aprobados en ${anio}. Solo podría acceder a un reembolso excepcional.`,
      }
    }
  }

  return { ok: true, montoSolicitado }
}

export async function crearSolicitud(
  grupoFamiliarId: string,
  _prevState: SolicitudFormState,
  formData: FormData
): Promise<SolicitudFormState> {
  await requireRole([...ROLES_GESTION_SOLICITUDES])

  // US-03.05: "bloqueo de nuevas solicitudes sin reactivación".
  const hogar = await obtenerGrupoFamiliar(grupoFamiliarId)
  if (!hogar) {
    return { error: 'Hogar no encontrado.', valores: leerCampos(formData) }
  }
  if (hogar.estado !== 'activo') {
    return {
      error: 'Este hogar está inactivo. Reactívalo antes de crear una nueva solicitud.',
      valores: leerCampos(formData),
    }
  }

  const campos = leerCampos(formData)
  const validacion = await validarCampos(grupoFamiliarId, campos)
  if (!validacion.ok) {
    return { error: validacion.error, valores: campos }
  }

  const estadoInicial: EstadoSolicitud =
    formData.get('accion')?.toString() === 'borrador' ? 'borrador' : 'ingresada'

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('solicitudes')
    .insert({
      grupo_familiar_id: grupoFamiliarId,
      tipo_ayuda_id: campos.tipo_ayuda_id,
      persona_id: campos.persona_id,
      fecha_solicitud: campos.fecha_solicitud,
      motivo: campos.motivo,
      observaciones: campos.observaciones,
      monto_solicitado: validacion.montoSolicitado,
      estado: estadoInicial,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { error: 'No se pudo crear la solicitud.', valores: campos }
  }

  revalidatePath(`/hogares/${grupoFamiliarId}`)
  revalidatePath('/solicitudes')
  redirect(`/solicitudes/${data.id}`)
}

export async function actualizarSolicitud(
  id: string,
  _prevState: SolicitudFormState,
  formData: FormData
): Promise<SolicitudFormState> {
  await requireRole([...ROLES_GESTION_SOLICITUDES])

  const campos = leerCampos(formData)

  const supabase = await createClient()
  const { data: actual, error: errorLectura } = await supabase
    .from('solicitudes')
    .select('grupo_familiar_id, estado, tipo_ayuda_id, persona_id')
    .eq('id', id)
    .maybeSingle()

  if (errorLectura || !actual) {
    return { error: 'Solicitud no encontrada.', valores: campos }
  }

  if (!ESTADOS_EDITABLES.includes(actual.estado)) {
    return {
      error: 'Solo se puede editar una solicitud en borrador o ingresada.',
      valores: campos,
    }
  }

  const validacion = await validarCampos(actual.grupo_familiar_id, campos, {
    tipo_ayuda_id: actual.tipo_ayuda_id,
    persona_id: actual.persona_id,
  })
  if (!validacion.ok) {
    return { error: validacion.error, valores: campos }
  }

  const { error } = await supabase
    .from('solicitudes')
    .update({
      tipo_ayuda_id: campos.tipo_ayuda_id,
      persona_id: campos.persona_id,
      fecha_solicitud: campos.fecha_solicitud,
      motivo: campos.motivo,
      observaciones: campos.observaciones,
      monto_solicitado: validacion.montoSolicitado,
    })
    .eq('id', id)

  if (error) {
    return { error: 'No se pudo actualizar la solicitud.', valores: campos }
  }

  revalidatePath(`/solicitudes/${id}`)
  revalidatePath('/solicitudes')
  redirect(`/solicitudes/${id}`)
}

// US-07.03 + US-05.04: validar RSH ≤ 40% al enviar a evaluación. CLAUDE.md
// es explícito en que la regla bloquea la *aprobación* ("un hogar con
// tramo RSH > 40% no puede aprobarse por flujo regular"), no el envío a
// evaluación — por eso este chequeo solo audita el resultado
// (registrar_validacion_rsh_solicitud) y deja pasar la transición a
// en_evaluacion igual, superado el umbral o no. El bloqueo real vive en
// aprobarSolicitud (lib/decisiones/actions.ts), que exige la excepción de
// US-05.05 (con informe social asociado, EPIC 23) para poder aprobar.
export async function enviarAEvaluacion(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- firma requerida por useActionState
  _prevState: EnviarEvaluacionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- firma requerida por useActionState
  _formData: FormData
): Promise<EnviarEvaluacionState> {
  await requireRole([...ROLES_GESTION_SOLICITUDES])

  const supabase = await createClient()
  const { data: solicitud, error } = await supabase
    .from('solicitudes')
    .select('estado, grupo_familiar_id, tipo_ayuda_id, fecha_solicitud')
    .eq('id', id)
    .maybeSingle()

  if (error || !solicitud) {
    throw new Error('Solicitud no encontrada.')
  }

  if (!ESTADOS_EDITABLES.includes(solicitud.estado)) {
    throw new Error('Solo se puede enviar a evaluación desde borrador o ingresada.')
  }

  // US-14.07: "el sistema valida que la fecha de la solicitud esté entre el
  // 1 de febrero y el 30 de noviembre" — solo para reembolso médico general
  // (no diálisis, EPIC 15, ni ayudas físicas). Se bloquea el ENVÍO, no la
  // creación: una solicitud puede guardarse como borrador con cualquier
  // fecha y corregirse antes de enviarla. Mismo patrón de retorno que el
  // bloqueo por RSH (mensaje explícito en vez de "throw"), para que
  // EnviarEvaluacionButton lo muestre igual de bien.
  const tipoAyuda = await obtenerTipoAyuda(solicitud.tipo_ayuda_id)
  if (tipoAyuda?.nombre === NOMBRE_TIPO_AYUDA_REEMBOLSO_GENERAL) {
    const mes = Number(solicitud.fecha_solicitud.slice(5, 7))
    const dentroDeVigencia =
      mes >= MES_INICIO_VIGENCIA_REEMBOLSO_GENERAL && mes <= MES_FIN_VIGENCIA_REEMBOLSO_GENERAL
    if (!dentroDeVigencia) {
      return {
        bloqueado:
          'El reembolso médico general solo puede solicitarse entre febrero y noviembre. Corrige la fecha de la solicitud antes de enviarla a evaluación.',
      }
    }
  }

  // US-15.02: "la solicitud no puede enviarse a evaluación sin certificado"
  // · US-15.01: "la solicitud exige documentos del gasto" (boleta o
  // comprobante) — ambos chequeos viven aquí (no en la creación) porque los
  // documentos se suben en un paso posterior a crear la solicitud (EPIC 10),
  // igual criterio que "exige documento de respaldo" del reembolso general
  // (ver nota en EPIC 10/14 — aquí el tipo de documento exigido es distinto).
  if (tipoAyuda?.nombre === NOMBRE_TIPO_AYUDA_REEMBOLSO_DIALISIS) {
    const { data: documentos, error: errorDocumentos } = await supabase
      .from('documentos')
      .select('tipo_documento')
      .eq('solicitud_id', id)

    if (errorDocumentos) {
      throw new Error('No se pudo verificar los documentos de la solicitud.')
    }

    const tiposSubidos = new Set((documentos ?? []).map((d) => d.tipo_documento))
    const tieneCertificado = tiposSubidos.has('certificado_dialisis')
    const tieneDocumentoDeGasto = tiposSubidos.has('boleta') || tiposSubidos.has('comprobante')

    if (!tieneCertificado || !tieneDocumentoDeGasto) {
      const faltantes = [
        !tieneCertificado ? 'certificado de diálisis' : null,
        !tieneDocumentoDeGasto ? 'boleta o comprobante del gasto' : null,
      ].filter((f): f is string => f !== null)

      return {
        bloqueado: `El reembolso por diálisis requiere adjuntar: ${faltantes.join(' y ')}. Sube los documentos antes de enviar a evaluación.`,
      }
    }
  }

  // US-25.01/US-25.04: "exige documento de respaldo" — mismo criterio que
  // diálisis arriba (se exige al enviar a evaluación, no al crear, porque
  // los documentos se suben después de creada la solicitud). Cirugía
  // reutiliza certificado_medico; fallecimiento usa certificado_defuncion
  // (ver lib/documentos/types.ts).
  if (
    tipoAyuda?.nombre === NOMBRE_TIPO_AYUDA_REEMBOLSO_CIRUGIA ||
    tipoAyuda?.nombre === NOMBRE_TIPO_AYUDA_REEMBOLSO_FALLECIMIENTO
  ) {
    const { data: documentos, error: errorDocumentos } = await supabase
      .from('documentos')
      .select('tipo_documento')
      .eq('solicitud_id', id)

    if (errorDocumentos) {
      throw new Error('No se pudo verificar los documentos de la solicitud.')
    }

    const tipoCertificadoExigido =
      tipoAyuda.nombre === NOMBRE_TIPO_AYUDA_REEMBOLSO_CIRUGIA ? 'certificado_medico' : 'certificado_defuncion'
    const tiposSubidos = new Set((documentos ?? []).map((d) => d.tipo_documento))
    const tieneCertificado = tiposSubidos.has(tipoCertificadoExigido)
    const tieneDocumentoDeGasto = tiposSubidos.has('boleta') || tiposSubidos.has('comprobante')

    if (!tieneCertificado || !tieneDocumentoDeGasto) {
      const faltantes = [
        !tieneCertificado ? TIPO_DOCUMENTO_LABELS[tipoCertificadoExigido].toLowerCase() : null,
        !tieneDocumentoDeGasto ? 'boleta o comprobante del gasto' : null,
      ].filter((f): f is string => f !== null)

      return {
        bloqueado: `${tipoAyuda.nombre} requiere adjuntar: ${faltantes.join(' y ')}. Sube los documentos antes de enviar a evaluación.`,
      }
    }
  }

  // US-07.03: "validación de documentos obligatorios" + US-06.02: "uso de
  // reglas al crear solicitudes" — regla genérica del catálogo
  // (`requiere_documentos`), para los tipos que no tienen un chequeo propio
  // más fino arriba (hoy: pañales de adulto y reembolso médico general; el
  // maestro pide respaldo documental para ambos, secciones 12 y 14). Exige
  // al menos un documento asociado a la solicitud; qué documento exacto
  // corresponde lo revisa el evaluador (US-14.02). Se lee del catálogo, así
  // que un tipo nuevo configurado por el administrador queda cubierto sin
  // tocar código.
  if (tipoAyuda?.requiere_documentos) {
    const { count, error: errorDocumentos } = await supabase
      .from('documentos')
      .select('id', { count: 'exact', head: true })
      .eq('solicitud_id', id)

    if (errorDocumentos) {
      throw new Error('No se pudo verificar los documentos de la solicitud.')
    }

    if (!count) {
      return {
        bloqueado: `${tipoAyuda.nombre} requiere documentos de respaldo. Sube al menos un documento antes de enviar a evaluación.`,
      }
    }
  }

  const hogar = await obtenerGrupoFamiliar(solicitud.grupo_familiar_id)
  if (!hogar) {
    throw new Error('Hogar no encontrado.')
  }

  const bloqueadoPorRsh = superaUmbralElegibilidad(hogar.tramo_rsh)

  await supabase.rpc('registrar_validacion_rsh_solicitud', {
    p_solicitud_id: id,
    p_resultado: bloqueadoPorRsh
      ? `requiere excepción: tramo ${hogar.tramo_rsh}% > ${UMBRAL_ELEGIBILIDAD_RSH}%`
      : `ok: tramo ${hogar.tramo_rsh ?? 'sin registrar'}%`,
  })

  // Revalidar siempre: la validación quedó auditada y debe ser visible de
  // inmediato (US-05.04: "nunca oculta ni disimula"), incluso cuando supera
  // el umbral — la solicitud sigue a evaluación igual, ver comentario arriba.
  revalidatePath(`/solicitudes/${id}`)

  const { error: errorUpdate } = await supabase
    .from('solicitudes')
    .update({ estado: 'en_evaluacion' })
    .eq('id', id)

  if (errorUpdate) {
    throw new Error('No se pudo enviar la solicitud a evaluación.')
  }

  revalidatePath('/solicitudes')
}

// US-07.06: mecanismo de cambio de estado. "Anular" (aquí), "observada" y
// "volver a evaluación" (más abajo, US-08.03) ya están implementadas. El
// resto (aprobada, rechazada, asignada_entrega_pago, entregada_pagada,
// cerrada) pertenece a EPIC 09/12/14.
// Anular es irreversible, así que exige motivo (mismo patrón que
// observarSolicitud): queda en solicitudes_historial como
// 'motivo_anulacion', junto al cambio de estado que ya audita el trigger.
export async function anularSolicitud(
  id: string,
  _prevState: AnularSolicitudState,
  formData: FormData
): Promise<AnularSolicitudState> {
  await requireRole([...ROLES_GESTION_SOLICITUDES])

  const motivo = formData.get('motivo')?.toString().trim() ?? ''
  if (!motivo) {
    return { error: 'El motivo de anulación es obligatorio.', motivo }
  }

  const supabase = await createClient()
  const { data: solicitud } = await supabase
    .from('solicitudes')
    .select('estado')
    .eq('id', id)
    .maybeSingle()

  if (!solicitud || !ESTADOS_ANULABLES.includes(solicitud.estado)) {
    return { error: 'Esta solicitud no puede anularse desde su estado actual.', motivo }
  }

  const { error } = await supabase.from('solicitudes').update({ estado: 'anulada' }).eq('id', id)
  if (error) {
    return { error: 'No se pudo anular la solicitud.', motivo }
  }

  await supabase.rpc('registrar_anulacion_solicitud', {
    p_solicitud_id: id,
    p_motivo: motivo,
  })

  revalidatePath(`/solicitudes/${id}`)
  revalidatePath('/solicitudes')
}

// US-08.03: observar una solicitud — exige motivo, solo desde "en
// evaluación". El motivo queda en solicitudes_historial vía la función de
// base de datos (no hay grant de insert directo sobre el historial).
export async function observarSolicitud(
  id: string,
  _prevState: ObservarSolicitudState,
  formData: FormData
): Promise<ObservarSolicitudState> {
  await requireRole([...ROLES_OBSERVAR_SOLICITUDES])

  const motivo = formData.get('motivo')?.toString().trim() ?? ''
  if (!motivo) {
    return { error: 'El motivo de observación es obligatorio.', motivo }
  }

  const supabase = await createClient()
  const { data: solicitud, error: errorLectura } = await supabase
    .from('solicitudes')
    .select('estado')
    .eq('id', id)
    .maybeSingle()

  if (errorLectura || !solicitud) {
    return { error: 'Solicitud no encontrada.', motivo }
  }

  if (solicitud.estado !== 'en_evaluacion') {
    return { error: 'Solo se puede observar una solicitud que está en evaluación.', motivo }
  }

  const { error } = await supabase
    .from('solicitudes')
    .update({ estado: 'observada' })
    .eq('id', id)

  if (error) {
    return { error: 'No se pudo observar la solicitud.', motivo }
  }

  await supabase.rpc('registrar_observacion_solicitud', {
    p_solicitud_id: id,
    p_motivo: motivo,
  })

  revalidatePath(`/solicitudes/${id}`)
  revalidatePath('/solicitudes')
}

// US-08.03: "la solicitud puede volver a evaluación cuando se complete" —
// sin input adicional, disponible para los mismos roles que pueden observar.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- firma requerida por <form action>
export async function volverAEvaluacion(id: string, _formData: FormData): Promise<void> {
  await requireRole([...ROLES_OBSERVAR_SOLICITUDES])

  const supabase = await createClient()
  const { data: solicitud } = await supabase
    .from('solicitudes')
    .select('estado')
    .eq('id', id)
    .maybeSingle()

  if (!solicitud || solicitud.estado !== 'observada') {
    throw new Error('Solo se puede volver a evaluación desde una solicitud observada.')
  }

  const { error } = await supabase
    .from('solicitudes')
    .update({ estado: 'en_evaluacion' })
    .eq('id', id)

  if (error) {
    throw new Error('No se pudo volver a evaluación.')
  }

  revalidatePath(`/solicitudes/${id}`)
  revalidatePath('/solicitudes')
}
