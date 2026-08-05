export type EstadoSector = 'activo' | 'inactivo'

export type Sector = {
  id: string
  nombre: string
  estado: EstadoSector
  creado_por: string | null
  actualizado_por: string | null
  created_at: string
  updated_at: string
}

export type HistorialCambioSector = {
  id: string
  sector_id: string
  campo: string
  valor_anterior: string | null
  valor_nuevo: string | null
  usuario_id: string | null
  creado_en: string
}
