import type { PeriodicidadBeneficio } from '@/lib/beneficios/types'

export type RecomendacionEvaluacion = 'aprobar' | 'rechazar'

export const RECOMENDACION_LABELS: Record<RecomendacionEvaluacion, string> = {
  aprobar: 'Aprobar',
  rechazar: 'Rechazar',
}

export type EvaluacionSocial = {
  id: string
  solicitud_id: string
  fundamento: string
  recomendacion: RecomendacionEvaluacion
  // MR-08: periodicidad que propone el gestor social para un beneficio
  // periódico; el aprobador la confirma o la cambia.
  periodicidad_propuesta: PeriodicidadBeneficio | null
  evaluador_id: string
  created_at: string
}

export type EvaluacionSocialConNombre = EvaluacionSocial & {
  evaluador_nombre: string | null
}
