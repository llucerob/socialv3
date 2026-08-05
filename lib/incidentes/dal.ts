import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type {
  IncidenteSeguridad,
  IncidenteSeguridadConNombres,
  HistorialCambioIncidente,
  TipoIncidenteSeguridad,
  EstadoIncidenteSeguridad,
} from './types'

export type FiltrosIncidentes = {
  fechaDesde?: string
  fechaHasta?: string
  tipo?: TipoIncidenteSeguridad
  estado?: EstadoIncidenteSeguridad
}

// US-26.02: "listado filtrable por fecha, tipo y estado" — consulta directa
// (no RPC): quien llama ya pasó por requireRole(administrador|auditor_consulta)
// y la RLS de la tabla ya resuelve el mismo criterio, igual que listarProveedores.
export async function listarIncidentes(filtros: FiltrosIncidentes): Promise<IncidenteSeguridad[]> {
  const supabase = await createClient()
  let query = supabase.from('incidentes_seguridad').select('*').order('fecha_incidente', { ascending: false })

  if (filtros.fechaDesde) query = query.gte('fecha_incidente', filtros.fechaDesde)
  if (filtros.fechaHasta) query = query.lte('fecha_incidente', filtros.fechaHasta)
  if (filtros.tipo) query = query.eq('tipo', filtros.tipo)
  if (filtros.estado) query = query.eq('estado', filtros.estado)

  const { data, error } = await query
  if (error) throw error
  return data as IncidenteSeguridad[]
}

// US-26.02: "se puede abrir el detalle completo de un incidente" — resuelve
// los 3 uuid de auth.users a nombre vía la RPC ya existente nombre_usuario()
// (mismo patrón que lib/reembolsos/dal.ts::obtenerPagoDeSolicitud), porque
// la RLS de profiles no permite un join directo desde acá.
export async function obtenerIncidente(id: string): Promise<IncidenteSeguridadConNombres | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('incidentes_seguridad').select('*').eq('id', id).maybeSingle()

  if (error) throw error
  if (!data) return null

  const incidente = data as IncidenteSeguridad
  const [usuarioInvolucrado, responsableSeguimiento, notificacionResponsable] = await Promise.all([
    incidente.usuario_involucrado_id
      ? supabase.rpc('nombre_usuario', { p_user_id: incidente.usuario_involucrado_id })
      : Promise.resolve({ data: null }),
    supabase.rpc('nombre_usuario', { p_user_id: incidente.responsable_seguimiento_id }),
    incidente.notificacion_responsable_id
      ? supabase.rpc('nombre_usuario', { p_user_id: incidente.notificacion_responsable_id })
      : Promise.resolve({ data: null }),
  ])

  return {
    ...incidente,
    usuario_involucrado_nombre: usuarioInvolucrado.data ?? null,
    responsable_seguimiento_nombre: responsableSeguimiento.data ?? null,
    notificacion_responsable_nombre: notificacionResponsable.data ?? null,
  }
}

export async function obtenerHistorialIncidente(id: string): Promise<HistorialCambioIncidente[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('incidentes_seguridad_historial')
    .select('*')
    .eq('incidente_id', id)
    .order('creado_en', { ascending: false })

  if (error) throw error
  return data as HistorialCambioIncidente[]
}
