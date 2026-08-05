import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { obtenerProveedor } from '@/lib/proveedores/dal'
import { actualizarProveedor } from '@/lib/proveedores/actions'
import { ProveedorForm } from '../../proveedor-form'

export default async function EditarProveedorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireRole(['administrador', 'bodega_logistica'])

  const proveedor = await obtenerProveedor(id)
  if (!proveedor) {
    notFound()
  }

  const actualizarConId = actualizarProveedor.bind(null, id)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar proveedor</h1>
      <ProveedorForm action={actualizarConId} defaultValues={proveedor} submitLabel="Guardar cambios" />
    </div>
  )
}
