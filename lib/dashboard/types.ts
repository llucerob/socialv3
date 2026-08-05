// EPIC 02 (US-02.01) — formas de las funciones RPC de
// supabase/migrations/20260814000001_dashboard_solicitudes_reembolsos.sql.
export type SolicitudPendienteAprobacionDashboard = {
  solicitud_id: string
  tipo_ayuda_nombre: string
  direccion: string
  persona_nombre: string | null
  fecha_solicitud: string
  ruta: string
}

export type ReembolsoPendientePagoDashboard = {
  solicitud_id: string
  tipo_ayuda_nombre: string
  direccion: string
  persona_nombre: string | null
  monto_aprobado: number | null
  ruta: string
}
