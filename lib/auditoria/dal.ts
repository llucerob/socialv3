import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { EventoAuditoria, FiltrosAuditoria, UsuarioAuditoria } from './types'

// US-16.04: "filtrar por fecha, usuario, entidad, acción". El filtrado
// ocurre en la función SQL (listar_eventos_auditoria, security definer) para
// no traer y filtrar en JS ~10 tablas distintas — ver el comentario de esa
// migración para el detalle de qué se incluye/excluye.
export async function listarEventosAuditoria(filtros: FiltrosAuditoria): Promise<EventoAuditoria[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('listar_eventos_auditoria', {
    p_fecha_desde: filtros.fechaDesde ? new Date(filtros.fechaDesde).toISOString() : null,
    p_fecha_hasta: filtros.fechaHasta ? new Date(filtros.fechaHasta + 'T23:59:59').toISOString() : null,
    p_usuario_id: filtros.usuarioId || null,
    p_entidad: filtros.entidad || null,
    p_accion: filtros.accion || null,
  })

  if (error) {
    throw new Error(`Error al consultar auditoría: ${error.message}`)
  }

  return data ?? []
}

export async function listarUsuariosParaAuditoria(): Promise<UsuarioAuditoria[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('listar_usuarios_para_auditoria')

  if (error) {
    throw new Error(`Error al listar usuarios: ${error.message}`)
  }

  return data ?? []
}
