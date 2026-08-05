export type NivelConfidencialidadInforme = 'estandar' | 'alta'

export const NIVEL_CONFIDENCIALIDAD_LABELS: Record<NivelConfidencialidadInforme, string> = {
  estandar: 'Estándar',
  alta: 'Alta',
}

export const NIVELES_CONFIDENCIALIDAD: NivelConfidencialidadInforme[] = ['estandar', 'alta']

export type InformeSocial = {
  id: string
  grupo_familiar_id: string
  persona_id: string | null
  solicitud_id: string | null
  fecha_informe: string
  motivo: string
  evaluacion_social: string
  antecedentes_familiares: string
  situacion_habitacional: string
  situacion_economica: string
  situacion_salud: string | null
  recomendacion_profesional: string
  ayuda_sugerida: string | null
  nivel_confidencialidad: NivelConfidencialidadInforme
  observaciones: string | null
  creado_por: string
  created_at: string
}

export type InformeSocialConNombres = InformeSocial & {
  creado_por_nombre: string | null
  persona_nombre: string | null
  solicitud_tipo_ayuda_nombre: string | null
}
