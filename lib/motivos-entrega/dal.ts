import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { MotivoEntregaFallida, HistorialCambioMotivoEntregaFallida } from './types'

export async function listarMotivosEntregaFallida(): Promise<MotivoEntregaFallida[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('motivos_entrega_fallida').select('*').order('nombre')
  if (error) throw error
  return data as MotivoEntregaFallida[]
}

// US-19.03: "la vista de terreno usa estos motivos" — el <select> de
// "marcar entrega fallida" solo ofrece motivos activos.
export async function listarMotivosEntregaFallidaActivos(): Promise<MotivoEntregaFallida[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('motivos_entrega_fallida')
    .select('*')
    .eq('estado', 'activo')
    .order('nombre')
  if (error) throw error
  return data as MotivoEntregaFallida[]
}

export async function obtenerMotivoEntregaFallida(id: string): Promise<MotivoEntregaFallida | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('motivos_entrega_fallida')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as MotivoEntregaFallida | null
}

export async function obtenerHistorialMotivoEntregaFallida(
  id: string
): Promise<HistorialCambioMotivoEntregaFallida[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('motivos_entrega_fallida_historial')
    .select('*')
    .eq('motivo_id', id)
    .order('creado_en', { ascending: false })
  if (error) throw error
  return data as HistorialCambioMotivoEntregaFallida[]
}
