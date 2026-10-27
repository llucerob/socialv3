import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { obtenerCompra, listarMovimientosDeCompra } from '@/lib/compras/dal'
import { TIPO_MOVIMIENTO_LABELS } from '@/lib/inventario/types'
import { Card } from '@/components/ui/Card'
import { ButtonLink } from '@/components/ui/Button'
import { formatearFecha } from '@/lib/fechas'

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
        <h1 className="text-2xl font-semibold text-text-primary">Orden de compra {compra.numero_orden_compra}</h1>
        <p className="text-sm text-text-muted">
          {compra.producto_nombre} · {compra.proveedor_nombre}
        </p>
      </div>

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-medium text-text-muted">Fecha de compra</h2>
            <p className="text-text-primary">{formatearFecha(compra.fecha_compra)}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-text-muted">Fecha de recepción</h2>
            <p className="text-text-primary">{compra.fecha_recepcion ?? 'Sin recibir'}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-text-muted">Cantidad</h2>
            <p className="text-text-primary">{compra.cantidad}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-text-muted">Valor unitario</h2>
            <p className="text-text-primary">${compra.valor_unitario.toLocaleString('es-CL')}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-text-muted">Valor total</h2>
            <p className="text-text-primary">${compra.valor_total.toLocaleString('es-CL')}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-text-muted">Documento tributario</h2>
            <p className="text-text-primary">{compra.documento_tributario ?? '—'}</p>
          </div>
          <div className="sm:col-span-2">
            <h2 className="text-sm font-medium text-text-muted">Registrado por</h2>
            <p className="text-text-primary">
              {compra.registrado_por_nombre ?? 'usuario desconocido'} ·{' '}
              {new Date(compra.created_at).toLocaleString('es-CL')}
            </p>
          </div>
        </div>
      </Card>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-text-primary">Ingresos de stock asociados</h2>
          <ButtonLink href={`/inventario/${compra.producto_id}/entrada`} variante="secondary">
            Registrar entrada
          </ButtonLink>
        </div>

        {movimientos.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">
            Sin ingresos de stock registrados todavía para esta compra.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border rounded-xl border border-border bg-surface">
            {movimientos.map((movimiento) => (
              <li key={movimiento.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-text-primary">
                  {TIPO_MOVIMIENTO_LABELS[movimiento.tipo]}: {movimiento.cantidad} {movimiento.producto_unidad_medida}
                  {movimiento.observacion && ` · ${movimiento.observacion}`}
                </span>
                <span className="text-xs text-text-muted">
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
