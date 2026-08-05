import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Compra, CompraConNombres } from './types'
import type { MovimientoStockConProducto } from '@/lib/inventario/types'

type FilaConRelaciones = Compra & {
  productos: { nombre: string } | null
  proveedores: { nombre: string } | null
}

const SELECT_CON_RELACIONES = '*, productos(nombre), proveedores(nombre)'

async function resolverNombres(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filas: FilaConRelaciones[]
): Promise<CompraConNombres[]> {
  const idsUnicos = [...new Set(filas.map((f) => f.registrado_por))]
  const nombresPorId = new Map<string, string | null>()
  await Promise.all(
    idsUnicos.map(async (id) => {
      const { data: nombre } = await supabase.rpc('nombre_usuario', { p_user_id: id })
      nombresPorId.set(id, nombre ?? null)
    })
  )

  return filas.map(({ productos, proveedores, ...compra }) => ({
    ...compra,
    producto_nombre: productos?.nombre ?? '',
    proveedor_nombre: proveedores?.nombre ?? '',
    registrado_por_nombre: nombresPorId.get(compra.registrado_por) ?? null,
  }))
}

export async function listarCompras(): Promise<CompraConNombres[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('compras')
    .select(SELECT_CON_RELACIONES)
    .order('fecha_compra', { ascending: false })

  if (error) throw error
  return resolverNombres(supabase, data as unknown as FilaConRelaciones[])
}

export async function obtenerCompra(id: string): Promise<CompraConNombres | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('compras')
    .select(SELECT_CON_RELACIONES)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const [compra] = await resolverNombres(supabase, [data as unknown as FilaConRelaciones])
  return compra
}

// US-24.02: el formulario de compra solo ofrece proveedores/productos —
// para elegir a cuál compra se está reabasteciendo (US-24.03), el
// formulario de entrada de stock necesita las compras de ESE producto.
export async function listarComprasDeProducto(productoId: string): Promise<CompraConNombres[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('compras')
    .select(SELECT_CON_RELACIONES)
    .eq('producto_id', productoId)
    .order('fecha_compra', { ascending: false })

  if (error) throw error
  return resolverNombres(supabase, data as unknown as FilaConRelaciones[])
}

type FilaMovimientoConProducto = MovimientoStockConProducto & {
  productos: { nombre: string; unidad_medida: string } | null
}

// US-24.03: "se puede consultar el historial de ingresos por compra".
export async function listarMovimientosDeCompra(compraId: string): Promise<MovimientoStockConProducto[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('movimientos_stock')
    .select('*, productos(nombre, unidad_medida)')
    .eq('compra_id', compraId)
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
