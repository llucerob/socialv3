import { requireRole } from '@/lib/auth/dal'
import { crearProveedor } from '@/lib/proveedores/actions'
import { ProveedorForm } from '../proveedor-form'

export default async function NuevoProveedorPage() {
  await requireRole(['administrador', 'bodega_logistica'])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nuevo proveedor</h1>
      <ProveedorForm action={crearProveedor} submitLabel="Crear proveedor" />
    </div>
  )
}
