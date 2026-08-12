import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { obtenerProducto } from '@/lib/inventario/dal'
import { registrarEntradaStock } from '@/lib/inventario/actions'
import { listarComprasDeProducto } from '@/lib/compras/dal'
import { EntradaStockForm } from '../../entrada-stock-form'

// US-11.02: registrar entrada de stock de un producto existente. US-24.03:
// la entrada puede referenciar una compra ya registrada para ese producto.
export default async function EntradaStockPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole(['administrador', 'bodega_logistica'])
  const { id } = await params
  const producto = await obtenerProducto(id)

  if (!producto) {
    notFound()
  }

  const compras = await listarComprasDeProducto(id)
  const registrarEntradaConId = registrarEntradaStock.bind(null, id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Registrar entrada de stock</h1>
        <p className="text-sm text-text-muted">
          {producto.nombre} · stock actual: {producto.stock_actual} {producto.unidad_medida}
        </p>
      </div>
      <EntradaStockForm action={registrarEntradaConId} compras={compras} />
    </div>
  )
}
