export type EstadoMotivoEntregaFallida = 'activo' | 'inactivo'

export type MotivoEntregaFallida = {
  id: string
  nombre: string
  estado: EstadoMotivoEntregaFallida
  creado_por: string | null
  actualizado_por: string | null
  created_at: string
  updated_at: string
}

export type HistorialCambioMotivoEntregaFallida = {
  id: string
  motivo_id: string
  campo: string
  valor_anterior: string | null
  valor_nuevo: string | null
  usuario_id: string | null
  creado_en: string
}
