import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { obtenerCompra, listarMovimientosDeCompra } from '@/lib/compras/dal'
import { TIPO_MOVIMIENTO_LABELS } from '@/lib/inventario/types'

// US-24.03: "se puede consultar el historial de ingresos por compra".
export default async function FichaCompraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireRole(['administrador', 'bodega_logistica'])

  const compra = await obtenerCompra(id)
  if (!compra) {
    notFound()
  }

  const movimientos = await listarMovimientosDeCompra(id)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Orden de compra {compra.numero_orden_compra}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {compra.producto_nombre} · {compra.proveedor_nombre}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Fecha de compra</h2>
          <p>{compra.fecha_compra}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Fecha de recepción</h2>
          <p>{compra.fecha_recepcion ?? 'Sin recibir'}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Cantidad</h2>
          <p>{compra.cantidad}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Valor unitario</h2>
          <p>${compra.valor_unitario.toLocaleString('es-CL')}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Valor total</h2>
          <p>${compra.valor_total.toLocaleString('es-CL')}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Documento tributario</h2>
          <p>{compra.documento_tributario ?? '—'}</p>
        </div>
        <div className="sm:col-span-2">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Registrado por</h2>
          <p>
            {compra.registrado_por_nombre ?? 'usuario desconocido'} ·{' '}
            {new Date(compra.created_at).toLocaleString('es-CL')}
          </p>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Ingresos de stock asociados</h2>
          <Link
            href={`/inventario/${compra.producto_id}/entrada`}
            className="rounded border border-black/10 px-3 py-1.5 text-sm font-medium dark:border-white/20"
          >
            Registrar entrada
          </Link>
        </div>

        {movimientos.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Sin ingresos de stock registrados todavía para esta compra.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
            {movimientos.map((movimiento) => (
              <li key={movimiento.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>
                  {TIPO_MOVIMIENTO_LABELS[movimiento.tipo]}: {movimiento.cantidad} {movimiento.producto_unidad_medida}
                  {movimiento.observacion && ` · ${movimiento.observacion}`}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {new Date(movimiento.created_at).toLocaleString('es-CL')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
