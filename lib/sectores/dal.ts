import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Sector, HistorialCambioSector } from './types'

export async function listarSectores(): Promise<Sector[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('sectores').select('*').order('nombre')
  if (error) throw error
  return data as Sector[]
}

// US-19.02: "los hogares pueden asociarse a un sector" — el formulario de
// hogar solo ofrece sectores activos (mismo criterio que
// listarTiposAyudaActivos, US-06.03).
export async function listarSectoresActivos(): Promise<Sector[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sectores')
    .select('*')
    .eq('estado', 'activo')
    .order('nombre')
  if (error) throw error
  return data as Sector[]
}

export async function obtenerSector(id: string): Promise<Sector | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('sectores').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as Sector | null
}

export async function obtenerHistorialSector(id: string): Promise<HistorialCambioSector[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sectores_historial')
    .select('*')
    .eq('sector_id', id)
    .order('creado_en', { ascending: false })
  if (error) throw error
  return data as HistorialCambioSector[]
}
