import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Persona, HistorialCambioPersona } from './types'

export async function listarIntegrantes(grupoFamiliarId: string): Promise<Persona[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .eq('grupo_familiar_id', grupoFamiliarId)
    .order('created_at')

  if (error) throw error
  return data as Persona[]
}

// US-04.03: "integrante inactivo no cuenta como beneficiario activo" — este
// es el punto que EPIC 07 usa para poblar el selector de persona beneficiaria.
export async function listarIntegrantesActivos(grupoFamiliarId: string): Promise<Persona[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .eq('grupo_familiar_id', grupoFamiliarId)
    .eq('estado', 'activo')
    .order('created_at')

  if (error) throw error
  return data as Persona[]
}

export async function obtenerPersona(id: string): Promise<Persona | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as Persona | null
}

// US-04.01: "advertencia ante RUT duplicado". Busca en TODO el sistema (no
// solo en el hogar actual) para que quien registra vea si esa persona ya
// figura en otro grupo familiar.
export async function buscarPersonaPorRut(
  rutNormalizado: string
): Promise<(Persona & { grupo_familiar_direccion: string | null }) | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('personas')
    .select('*, grupos_familiares(direccion)')
    .eq('rut', rutNormalizado)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const { grupos_familiares, ...persona } = data as Persona & {
    grupos_familiares: { direccion: string } | null
  }

  return {
    ...persona,
    grupo_familiar_direccion: grupos_familiares?.direccion ?? null,
  }
}

export async function obtenerHistorialPersona(id: string): Promise<HistorialCambioPersona[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('personas_historial')
    .select('*')
    .eq('persona_id', id)
    .order('creado_en', { ascending: false })

  if (error) throw error
  return data as HistorialCambioPersona[]
}
