export type Compra = {
  id: string
  producto_id: string
  proveedor_id: string
  numero_orden_compra: string
  fecha_compra: string
  fecha_recepcion: string | null
  cantidad: number
  valor_unitario: number
  valor_total: number
  documento_tributario: string | null
  registrado_por: string
  created_at: string
}

export type CompraConNombres = Compra & {
  producto_nombre: string
  proveedor_nombre: string
  registrado_por_nombre: string | null
}
