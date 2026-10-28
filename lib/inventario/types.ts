export type Producto = {
  id: string
  nombre: string
  categoria: string
  unidad_medida: string
  stock_actual: number
  stock_minimo: number
  creado_por: string | null
  created_at: string
  updated_at: string
}

export type TipoMovimientoStock = 'entrada' | 'salida'

export const TIPO_MOVIMIENTO_LABELS: Record<TipoMovimientoStock, string> = {
  entrada: 'Entrada',
  salida: 'Salida',
}

export type MovimientoStock = {
  id: string
  producto_id: string
  tipo: TipoMovimientoStock
  cantidad: number
  solicitud_id: string | null
  // US-24.03: "el ingreso de stock puede referenciar una compra
  // registrada" — opcional, y exclusivo de entradas (mismo criterio que
  // solicitud_id, exclusivo de salidas).
  compra_id: string | null
  // MR-08: período del beneficio al que corresponde una salida (null en
  // entradas y en ayudas únicas).
  periodo: string | null
  observacion: string | null
  registrado_por: string
  created_at: string
}

export type MovimientoStockConProducto = MovimientoStock & {
  producto_nombre: string
  producto_unidad_medida: string
}
