import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Producto, MovimientoStockConProducto } from './types'

// US-11.04: "ver stock disponible" — listado completo, sin importar si está
// bajo el mínimo (el resaltado de bajo stock es responsabilidad de la UI).
export async function listarProductos(): Promise<Producto[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('productos').select('*').order('nombre')
  if (error) throw error
  return data as Producto[]
}

export async function obtenerProducto(id: string): Promise<Producto | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as Producto | null
}

type FilaMovimientoConProducto = MovimientoStockConProducto & {
  productos: { nombre: string; unidad_medida: string } | null
}

// US-11.03: historial de salidas de una solicitud, mostrado en su detalle
// para evidenciar "el movimiento queda registrado".
export async function listarMovimientosDeSolicitud(
  solicitudId: string
): Promise<MovimientoStockConProducto[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('movimientos_stock')
    .select('*, productos(nombre, unidad_medida)')
    .eq('solicitud_id', solicitudId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data as unknown as FilaMovimientoConProducto[]).map((fila) => {
    const { productos, ...movimiento } = fila
    return {
      ...movimiento,
      producto_nombre: productos?.nombre ?? '',
      producto_unidad_medida: productos?.unidad_medida ?? '',
    }
  })
}

// MR-07: una entrega exige la salida de stock registrada. Vía función
// security definer porque gestor social, aprobador y terreno no leen
// movimientos_stock; solo devuelve qué solicitudes tienen salida.
export async function solicitudesConSalidaStock(solicitudIds: string[]): Promise<Set<string>> {
  if (solicitudIds.length === 0) return new Set()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('solicitudes_con_salida_stock', { p_solicitud_ids: solicitudIds })
  if (error) throw error
  return new Set((data as string[] | null) ?? [])
}

export async function tieneSalidaStock(solicitudId: string): Promise<boolean> {
  return (await solicitudesConSalidaStock([solicitudId])).has(solicitudId)
}
