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
  evaluador_id: string
  created_at: string
}

export type EvaluacionSocialConNombre = EvaluacionSocial & {
  evaluador_nombre: string | null
}
