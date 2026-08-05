import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Usuario, HistorialCambioUsuario } from './types'

// US-19.01: "se listan usuarios". Consulta directa contra `profiles`, no una
// función RPC — a diferencia de auditoría (que necesita cruzar tablas con
// RLS más restrictiva que la del que consulta), aquí quien llama ya es
// administrador y su propia RLS (profiles_select_own_or_admin) le permite
// leer cualquier fila directamente.
export async function listarUsuarios(): Promise<Usuario[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nombre, email, rol, estado, created_at')
    .order('nombre')

  if (error) throw error
  return data as Usuario[]
}

export async function obtenerUsuario(id: string): Promise<Usuario | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nombre, email, rol, estado, created_at')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as Usuario | null
}

export async function obtenerHistorialUsuario(id: string): Promise<HistorialCambioUsuario[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles_historial')
    .select('*')
    .eq('profile_id', id)
    .order('creado_en', { ascending: false })

  if (error) throw error
  return data as HistorialCambioUsuario[]
}
