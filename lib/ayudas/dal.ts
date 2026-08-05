import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { TipoAyuda, HistorialCambioTipoAyuda } from './types'

export async function listarTiposAyuda(): Promise<TipoAyuda[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('tipos_ayuda').select('*').order('nombre')
  if (error) throw error
  return data as TipoAyuda[]
}

// US-06.01/06.03: "solo ayudas activas seleccionables" / "ayuda inactiva no
// aparece en nuevas solicitudes". Punto único que EPIC 07 (solicitudes) debe
// usar para poblar el selector de tipo de ayuda cuando exista.
export async function listarTiposAyudaActivos(): Promise<TipoAyuda[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tipos_ayuda')
    .select('*')
    .eq('estado', 'activo')
    .order('nombre')
  if (error) throw error
  return data as TipoAyuda[]
}

export async function obtenerTipoAyuda(id: string): Promise<TipoAyuda | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tipos_ayuda')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as TipoAyuda | null
}

export async function obtenerHistorialTipoAyuda(id: string): Promise<HistorialCambioTipoAyuda[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tipos_ayuda_historial')
    .select('*')
    .eq('tipo_ayuda_id', id)
    .order('creado_en', { ascending: false })

  if (error) throw error
  return data as HistorialCambioTipoAyuda[]
}
