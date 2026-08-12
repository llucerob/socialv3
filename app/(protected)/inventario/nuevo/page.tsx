import { requireRole } from '@/lib/auth/dal'
import { crearProducto } from '@/lib/inventario/actions'
import { ProductoForm } from '../producto-form'

export default async function NuevoProductoPage() {
  await requireRole(['administrador', 'bodega_logistica'])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text-primary">Nuevo producto</h1>
      <ProductoForm action={crearProducto} />
    </div>
  )
}
