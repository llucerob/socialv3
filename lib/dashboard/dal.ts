import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { SolicitudPendienteAprobacionDashboard, ReembolsoPendientePagoDashboard } from './types'

// EPIC 02 (US-02.01) — tarjeta "Solicitudes pendientes de aprobación".
export async function listarSolicitudesPendientesAprobacionDashboard(): Promise<
  SolicitudPendienteAprobacionDashboard[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('listar_solicitudes_pendientes_aprobacion_dashboard')

  if (error) throw new Error(`Error al consultar las solicitudes pendientes de aprobación: ${error.message}`)
  return data ?? []
}

// EPIC 02 (US-02.01) — tarjeta "Reembolsos pendientes".
export async function listarReembolsosPendientesPagoDashboard(): Promise<ReembolsoPendientePagoDashboard[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('listar_reembolsos_pendientes_pago_dashboard')

  if (error) throw new Error(`Error al consultar los reembolsos pendientes de pago: ${error.message}`)
  return data ?? []
}
