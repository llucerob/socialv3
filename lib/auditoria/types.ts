import type { RolUsuario } from '@/lib/auth/types'

// Mantener en sincronía con los literales de entidad/acción devueltos por
// la función SQL listar_eventos_auditoria() (20260805000001_auditoria_fn.sql).
export const ENTIDADES_AUDITORIA = [
  'grupo_familiar',
  'persona',
  'solicitud',
  'documento',
  'tipo_ayuda',
  'entrega',
  'producto',
  'hito',
] as const

export type EntidadAuditoria = (typeof ENTIDADES_AUDITORIA)[number]

export const ACCIONES_AUDITORIA = [
  'creacion',
  'cambio_campo',
  'cambio_estado',
  'validacion_rsh',
  'observacion',
  'bloqueo_tope',
  'aprobacion',
  'rechazo',
  'pago',
  'entrada',
  'salida',
  'acceso_denegado',
  'eliminacion',
] as const

export type AccionAuditoria = (typeof ACCIONES_AUDITORIA)[number]

export const ENTIDAD_AUDITORIA_LABELS: Record<EntidadAuditoria, string> = {
  grupo_familiar: 'Hogar',
  persona: 'Integrante',
  solicitud: 'Solicitud',
  documento: 'Documento',
  tipo_ayuda: 'Tipo de ayuda',
  entrega: 'Entrega',
  producto: 'Producto',
  hito: 'Hito',
}

export const ACCION_AUDITORIA_LABELS: Record<AccionAuditoria, string> = {
  creacion: 'Creación',
  cambio_campo: 'Cambio de campo',
  cambio_estado: 'Cambio de estado',
  validacion_rsh: 'Validación RSH',
  observacion: 'Observación',
  bloqueo_tope: 'Bloqueo por tope',
  aprobacion: 'Aprobación',
  rechazo: 'Rechazo',
  pago: 'Pago',
  entrada: 'Entrada de stock',
  salida: 'Salida de stock',
  acceso_denegado: 'Acceso denegado',
  eliminacion: 'Eliminación',
}

export type EventoAuditoria = {
  fecha: string
  usuario_id: string | null
  usuario_nombre: string | null
  entidad: string
  entidad_id: string
  accion: string
  detalle: string
  ruta: string | null
}

export type UsuarioAuditoria = {
  id: string
  nombre: string
  roles: RolUsuario[]
}

export type FiltrosAuditoria = {
  fechaDesde?: string
  fechaHasta?: string
  usuarioId?: string
  entidad?: string
  accion?: string
}
