import { requireRole } from '@/lib/auth/dal'
import { crearCompra } from '@/lib/compras/actions'
import { listarProductos } from '@/lib/inventario/dal'
import { listarProveedoresActivos } from '@/lib/proveedores/dal'
import { CompraForm } from '../compra-form'

export default async function NuevaCompraPage() {
  await requireRole(['administrador', 'bodega_logistica'])

  const [productos, proveedores] = await Promise.all([listarProductos(), listarProveedoresActivos()])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text-primary">Nueva compra</h1>
      <CompraForm action={crearCompra} productos={productos} proveedores={proveedores} />
    </div>
  )
}
