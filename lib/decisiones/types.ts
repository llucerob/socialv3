import type { PeriodicidadBeneficio } from '@/lib/beneficios/types'
import type { ModalidadEntrega } from '@/lib/entregas/types'

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
  // La misma persona registró una evaluación social de esta solicitud y
  // tomó la decisión (posible con roles múltiples; se marca, no se
  // bloquea). Lo calcula un trigger al insertar.
  decidida_por_quien_evaluo: boolean
  // MR-08: lo aprobado para un beneficio periódico (null en una ayuda única).
  // La modalidad vigente está en `beneficios`, que puede cambiar después.
  periodicidad: PeriodicidadBeneficio | null
  modalidad_entrega: ModalidadEntrega | null
  aprobador_id: string
  created_at: string
}

export type DecisionSolicitudConNombre = DecisionSolicitud & {
  aprobador_nombre: string | null
}
