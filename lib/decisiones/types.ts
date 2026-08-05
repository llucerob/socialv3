export type TipoDecisionSolicitud = 'aprobada' | 'rechazada'

export const DECISION_LABELS: Record<TipoDecisionSolicitud, string> = {
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
}

export type DecisionSolicitud = {
  id: string
  solicitud_id: string
  decision: TipoDecisionSolicitud
  comentario: string | null
  monto_aprobado: number | null
  cantidad_aprobada: string | null
  // US-05.05: solo la usa la excepción RSH (lib/decisiones/actions.ts,
  // aprobarExcepcionRsh) — null en el resto de las decisiones.
  autoridad_solicitante: string | null
  aprobador_id: string
  created_at: string
}

export type DecisionSolicitudConNombre = DecisionSolicitud & {
  aprobador_nombre: string | null
}
