import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { cancelarEntregasVencidas } from '@/lib/entregas/dal'
import type {
  ResumenBeneficio,
  PeriodoBeneficio,
  PeriodoPorPreparar,
  HistorialCambioBeneficio,
} from './types'

// MR-08: todo vía funciones security definer (listar_beneficios y
// compañía), porque el resumen cruza entregas y salidas de stock, que el
// gestor social y el aprobador no leen directamente.
export async function listarBeneficiosDeHogar(grupoFamiliarId: string): Promise<ResumenBeneficio[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('listar_beneficios', { p_grupo_familiar_id: grupoFamiliarId })
  if (error) throw new Error(`Error al consultar los beneficios del hogar: ${error.message}`)
  return data ?? []
}

export async function obtenerBeneficioDeSolicitud(solicitudId: string): Promise<ResumenBeneficio | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('listar_beneficios', { p_solicitud_id: solicitudId })
  if (error) throw new Error(`Error al consultar el beneficio de la solicitud: ${error.message}`)
  return data?.[0] ?? null
}

export async function listarPeriodosDeBeneficio(solicitudId: string): Promise<PeriodoBeneficio[]> {
  await cancelarEntregasVencidas()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('listar_periodos_de_beneficio', { p_solicitud_id: solicitudId })
  if (error) throw new Error(`Error al consultar los períodos del beneficio: ${error.message}`)
  return data ?? []
}

// Bodega: períodos ya iniciados de beneficios vigentes que faltan por entregar.
export async function listarPeriodosPorPreparar(): Promise<PeriodoPorPreparar[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('listar_periodos_por_preparar')
  if (error) throw new Error(`Error al consultar los beneficios por preparar: ${error.message}`)
  return data ?? []
}

export async function obtenerHistorialBeneficio(beneficioId: string): Promise<HistorialCambioBeneficio[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('beneficios_historial')
    .select('*')
    .eq('beneficio_id', beneficioId)
    .order('creado_en', { ascending: false })

  if (error) throw error
  return data as HistorialCambioBeneficio[]
}
