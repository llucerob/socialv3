'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'

// US-14.04: "solo finanzas o administrador puede registrar pago".
const ROLES_FINANZAS = ['administrador', 'finanzas'] as const

const ESTADOS_CON_PAGO_PENDIENTE = ['aprobada', 'aprobada_excepcion']

type ValoresPagoFormulario = {
  fecha_pago: string
  monto_pagado: string
  medio_pago: string
  observacion: string
}

export type PagoReembolsoFormState =
  | { error?: string; valores: ValoresPagoFormulario }
  | undefined

// US-14.04: "fecha de pago, monto pagado, medio de pago, observación" ·
// "el monto pagado no puede superar el monto aprobado" (garantizado también
// por el trigger de la migración, ver create_pagos_reembolso.sql — aquí se
// valida primero para dar un mensaje de error legible en vez de que la
// inserción falle con un error genérico de base de datos) · "la solicitud
// pasa a pagada o cerrada" (rpc marcar_solicitud_reembolso_pagada) · "la
// acción queda auditada" (la fila insertada en pagos_reembolso ES el
// registro de auditoría, igual criterio que evaluaciones_sociales/
// movimientos_stock — no editable, no hay update/delete).
export async function registrarPagoReembolso(
  solicitudId: string,
  _prevState: PagoReembolsoFormState,
  formData: FormData
): Promise<PagoReembolsoFormState> {
  await requireRole([...ROLES_FINANZAS])

  const valores: ValoresPagoFormulario = {
    fecha_pago: formData.get('fecha_pago')?.toString().trim() ?? '',
    monto_pagado: formData.get('monto_pagado')?.toString().trim() ?? '',
    medio_pago: formData.get('medio_pago')?.toString().trim() ?? '',
    observacion: formData.get('observacion')?.toString().trim() ?? '',
  }

  if (!valores.fecha_pago) {
    return { error: 'Ingresa la fecha de pago.', valores }
  }
  if (!valores.medio_pago) {
    return { error: 'Ingresa el medio de pago.', valores }
  }

  const montoPagado = Number(valores.monto_pagado)
  if (!valores.monto_pagado || Number.isNaN(montoPagado) || montoPagado <= 0) {
    return { error: 'El monto pagado debe ser un número mayor a cero.', valores }
  }

  const supabase = await createClient()

  const { data: solicitud, error: errorSolicitud } = await supabase
    .from('solicitudes')
    .select('estado')
    .eq('id', solicitudId)
    .maybeSingle()

  if (errorSolicitud || !solicitud) {
    return { error: 'Solicitud no encontrada.', valores }
  }

  if (!ESTADOS_CON_PAGO_PENDIENTE.includes(solicitud.estado)) {
    return { error: 'Solo se puede registrar el pago de una solicitud aprobada.', valores }
  }

  const { data: decision, error: errorDecision } = await supabase
    .from('decisiones_solicitud')
    .select('monto_aprobado')
    .eq('solicitud_id', solicitudId)
    .eq('decision', 'aprobada')
    .maybeSingle()

  if (errorDecision || !decision || decision.monto_aprobado === null) {
    return { error: 'Esta solicitud no tiene un monto aprobado registrado.', valores }
  }

  if (montoPagado > decision.monto_aprobado) {
    return {
      error: `El monto pagado no puede superar el monto aprobado ($${decision.monto_aprobado.toLocaleString('es-CL')}).`,
      valores,
    }
  }

  const { error: errorInsert } = await supabase.from('pagos_reembolso').insert({
    solicitud_id: solicitudId,
    fecha_pago: valores.fecha_pago,
    monto_pagado: montoPagado,
    medio_pago: valores.medio_pago,
    observacion: valores.observacion || null,
  })

  if (errorInsert) {
    return { error: 'No se pudo registrar el pago.', valores }
  }

  await supabase.rpc('marcar_solicitud_reembolso_pagada', { p_solicitud_id: solicitudId })

  revalidatePath(`/solicitudes/${solicitudId}`)
  revalidatePath('/solicitudes')
}
