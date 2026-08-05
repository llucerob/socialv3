import type { RolUsuario } from '@/lib/auth/types'

// Cada sección corresponde a un criterio de aceptación de US-02.01. Por ahora
// son placeholders de estructura (sin consultas a datos reales); se
// conectarán a datos concretos a medida que existan las historias que los
// generan (solicitudes, entregas, reembolsos).
export type DashboardSectionId =
  | 'solicitudes_pendientes'
  | 'solicitudes_evaluacion'
  | 'entregas_pendientes'
  | 'reembolsos_pendientes'
  | 'alertas'

export const DASHBOARD_SECTION_LABELS: Record<DashboardSectionId, string> = {
  solicitudes_pendientes: 'Solicitudes pendientes de aprobación',
  solicitudes_evaluacion: 'Solicitudes en evaluación',
  entregas_pendientes: 'Entregas pendientes',
  reembolsos_pendientes: 'Reembolsos pendientes',
  alertas: 'Alertas',
}

export const DASHBOARD_SECTIONS_BY_ROL: Record<RolUsuario, DashboardSectionId[]> = {
  administrador: [
    'solicitudes_pendientes',
    'solicitudes_evaluacion',
    'entregas_pendientes',
    'reembolsos_pendientes',
    'alertas',
  ],
  evaluador_social: ['solicitudes_evaluacion', 'alertas'],
  aprobador: ['solicitudes_pendientes', 'alertas'],
  bodega_logistica: ['entregas_pendientes', 'alertas'],
  terreno_repartidor: ['entregas_pendientes'],
  finanzas: ['reembolsos_pendientes', 'alertas'],
  auditor_consulta: [
    'solicitudes_pendientes',
    'entregas_pendientes',
    'reembolsos_pendientes',
    'alertas',
  ],
}
