import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { obtenerProveedor, obtenerHistorialProveedor } from '@/lib/proveedores/dal'
import { cambiarEstadoProveedor } from '@/lib/proveedores/actions'
import { Button, ButtonLink } from '@/components/ui/Button'
import { EstadoBadge } from '@/components/ui/EstadoBadge'

export default async function FichaProveedorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireRole(['administrador', 'bodega_logistica'])
  const proveedor = await obtenerProveedor(id)

  if (!proveedor) {
    notFound()
  }

  const historial = await obtenerHistorialProveedor(id)
  const cambiarEstadoConId = cambiarEstadoProveedor.bind(null, proveedor.id)

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{proveedor.nombre}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-text-muted">
            <span>{proveedor.rut}</span>
            <EstadoBadge estado={proveedor.estado} />
          </p>
          {proveedor.contacto && <p className="text-sm text-text-muted">{proveedor.contacto}</p>}
        </div>
        <div className="flex items-center gap-2">
          <form action={cambiarEstadoConId}>
            <input type="hidden" name="estado" value={proveedor.estado === 'activo' ? 'inactivo' : 'activo'} />
            <Button type="submit" variante="secondary">
              {proveedor.estado === 'activo' ? 'Desactivar' : 'Activar'}
            </Button>
          </form>
          <ButtonLink href={`/inventario/proveedores/${proveedor.id}/editar`} variante="secondary">
            Editar
          </ButtonLink>
        </div>
      </div>

      <section>
        <h2 className="font-medium text-text-primary">Historial de cambios</h2>
        {historial.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">Sin cambios registrados todavía.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {historial.map((cambio) => (
              <li key={cambio.id} className="text-text-muted">
                {new Date(cambio.creado_en).toLocaleString('es-CL')} · {cambio.campo}:{' '}
                {cambio.valor_anterior ?? '—'} → {cambio.valor_nuevo ?? '—'}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
