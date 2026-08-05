import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { normalizarRut } from '@/lib/personas/rut'
import { evaluarEstadoRsh } from './rsh'
import type { GrupoFamiliar, HistorialCambioGrupoFamiliar } from './types'

// US-03.02: búsqueda por dirección, sector y nombre/RUT de integrante (EPIC 04
// ya existe). El RUT se guarda en formato canónico "cuerpo-dv" (ver
// lib/personas/rut.ts), así que si lo buscado normaliza a un RUT completo y
// válido (con o sin puntos/guion) se compara contra esa forma canónica;
// si no (búsqueda parcial, sin dígito verificador), se hace un match de
// substring más laxo (solo se quitan puntos/espacios, igual que `limpiar()`).
//
// Se evita `.or()` de supabase-js porque su sintaxis de filtro raw rompe si el
// texto de búsqueda trae comas o paréntesis (direcciones rurales suelen
// tenerlos, ej. "Camino Rural, Km 5") — en su lugar se consulta cada columna
// por separado y se combinan los resultados en JS.
export async function buscarGruposFamiliares(query: string): Promise<GrupoFamiliar[]> {
  const supabase = await createClient()
  const q = query.trim()

  if (!q) {
    const { data, error } = await supabase
      .from('grupos_familiares')
      .select('*')
      .order('direccion')
      .limit(50)

    if (error) throw error
    return data as GrupoFamiliar[]
  }

  const pattern = `%${q}%`
  const rutNormalizado = normalizarRut(q)
  const rutPattern = `%${rutNormalizado ?? q.replace(/[.\s]/g, '')}%`
  const [porDireccion, porSector, porNombre, porApellido, porRut] = await Promise.all([
    supabase.from('grupos_familiares').select('*').ilike('direccion', pattern).limit(50),
    supabase.from('grupos_familiares').select('*').ilike('sector', pattern).limit(50),
    supabase.from('personas').select('grupos_familiares(*)').ilike('nombres', pattern).limit(50),
    supabase.from('personas').select('grupos_familiares(*)').ilike('apellidos', pattern).limit(50),
    supabase.from('personas').select('grupos_familiares(*)').ilike('rut', rutPattern).limit(50),
  ])

  if (porDireccion.error) throw porDireccion.error
  if (porSector.error) throw porSector.error
  if (porNombre.error) throw porNombre.error
  if (porApellido.error) throw porApellido.error
  if (porRut.error) throw porRut.error

  const vistos = new Map<string, GrupoFamiliar>()
  for (const hogar of [...porDireccion.data, ...porSector.data]) {
    vistos.set(hogar.id, hogar as GrupoFamiliar)
  }
  for (const fila of [...porNombre.data, ...porApellido.data, ...porRut.data] as unknown as {
    grupos_familiares: GrupoFamiliar | null
  }[]) {
    if (fila.grupos_familiares) {
      vistos.set(fila.grupos_familiares.id, fila.grupos_familiares)
    }
  }

  return Array.from(vistos.values()).sort((a, b) => a.direccion.localeCompare(b.direccion))
}

// US-13.05: "listado filtrable de hogares sin coordenadas" — para priorizar
// su regularización y mejorar progresivamente el cálculo automático de
// rutas (US-13.04). El filtro por sector reutiliza el mismo campo de texto
// libre que la búsqueda general (US-03.02).
export async function listarHogaresPendientesGeoreferenciar(sector?: string): Promise<GrupoFamiliar[]> {
  const supabase = await createClient()
  let query = supabase
    .from('grupos_familiares')
    .select('*')
    .or('latitud.is.null,longitud.is.null')
    .order('direccion')

  if (sector) {
    query = query.ilike('sector', `%${sector}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data as GrupoFamiliar[]
}

// EPIC 02 (US-02.01) — alerta "RSH desactualizado" del dashboard. Reutiliza
// evaluarEstadoRsh (lib/hogares/rsh.ts, US-05.03) para no duplicar el
// umbral — mismo criterio que ya usa RshBadge por hogar, acá agregado en
// listado. grupos_familiares ya es de lectura abierta a cualquier rol
// válido, así que no hace falta una función RPC.
export async function listarHogaresConRshDesactualizado(): Promise<GrupoFamiliar[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('grupos_familiares')
    .select('*')
    .eq('estado', 'activo')
    .order('direccion')

  if (error) throw error
  return (data as GrupoFamiliar[]).filter(
    (hogar) => evaluarEstadoRsh(hogar.tramo_rsh, hogar.fecha_actualizacion_rsh).tipo !== 'vigente'
  )
}

export async function obtenerGrupoFamiliar(id: string): Promise<GrupoFamiliar | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('grupos_familiares')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as GrupoFamiliar | null
}

export async function obtenerHistorialGrupoFamiliar(
  id: string
): Promise<HistorialCambioGrupoFamiliar[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('grupos_familiares_historial')
    .select('*')
    .eq('grupo_familiar_id', id)
    .order('creado_en', { ascending: false })

  if (error) throw error
  return data as HistorialCambioGrupoFamiliar[]
}
