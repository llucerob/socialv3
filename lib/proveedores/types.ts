export type EstadoProveedor = 'activo' | 'inactivo'

export type Proveedor = {
  id: string
  nombre: string
  rut: string
  contacto: string | null
  estado: EstadoProveedor
  creado_por: string | null
  actualizado_por: string | null
  created_at: string
  updated_at: string
}

export type HistorialCambioProveedor = {
  id: string
  proveedor_id: string
  campo: string
  valor_anterior: string | null
  valor_nuevo: string | null
  usuario_id: string | null
  creado_en: string
}
