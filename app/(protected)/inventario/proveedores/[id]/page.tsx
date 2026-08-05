import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { obtenerProveedor, obtenerHistorialProveedor } from '@/lib/proveedores/dal'
import { cambiarEstadoProveedor } from '@/lib/proveedores/actions'

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
          <h1 className="text-2xl font-semibold">{proveedor.nombre}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {proveedor.rut} · estado {proveedor.estado}
          </p>
          {proveedor.contacto && <p className="text-sm text-zinc-600 dark:text-zinc-400">{proveedor.contacto}</p>}
        </div>
        <div className="flex items-center gap-2">
          <form action={cambiarEstadoConId}>
            <input type="hidden" name="estado" value={proveedor.estado === 'activo' ? 'inactivo' : 'activo'} />
            <button
              type="submit"
              className="rounded border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/20"
            >
              {proveedor.estado === 'activo' ? 'Desactivar' : 'Activar'}
            </button>
          </form>
          <Link
            href={`/inventario/proveedores/${proveedor.id}/editar`}
            className="rounded border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/20"
          >
            Editar
          </Link>
        </div>
      </div>

      <section>
        <h2 className="font-medium">Historial de cambios</h2>
        {historial.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Sin cambios registrados todavía.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {historial.map((cambio) => (
              <li key={cambio.id} className="text-zinc-600 dark:text-zinc-400">
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
