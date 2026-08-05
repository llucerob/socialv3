import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Proveedor, HistorialCambioProveedor } from './types'

export async function listarProveedores(): Promise<Proveedor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('proveedores').select('*').order('nombre')
  if (error) throw error
  return data as Proveedor[]
}

// US-24.01: "listado de proveedores activos" — usado por el formulario de
// compra (US-24.02) para elegir proveedor.
export async function listarProveedoresActivos(): Promise<Proveedor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('proveedores')
    .select('*')
    .eq('estado', 'activo')
    .order('nombre')
  if (error) throw error
  return data as Proveedor[]
}

export async function obtenerProveedor(id: string): Promise<Proveedor | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('proveedores').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as Proveedor | null
}

export async function obtenerHistorialProveedor(id: string): Promise<HistorialCambioProveedor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('proveedores_historial')
    .select('*')
    .eq('proveedor_id', id)
    .order('creado_en', { ascending: false })
  if (error) throw error
  return data as HistorialCambioProveedor[]
}
