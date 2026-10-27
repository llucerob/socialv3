import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { listarCompras } from '@/lib/compras/dal'
import { ButtonLink } from '@/components/ui/Button'
import { formatearFecha } from '@/lib/fechas'

const ROLES_COMPRAS = ['administrador', 'bodega_logistica'] as const

// US-24.02: "registrar compra municipal" — listado de compras registradas.
export default async function ComprasPage() {
  await requireRole([...ROLES_COMPRAS])
  const compras = await listarCompras()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Compras</h1>
        <ButtonLink href="/inventario/compras/nueva">Nueva compra</ButtonLink>
      </div>

      {compras.length === 0 ? (
        <p className="text-sm text-text-muted">Sin compras registradas.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {compras.map((compra) => (
            <li key={compra.id}>
              <Link
                href={`/inventario/compras/${compra.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-surface-alt"
              >
                <span>
                  <span className="font-medium text-text-primary">{compra.producto_nombre}</span>
                  <span className="ml-2 text-sm text-text-muted">
                    OC {compra.numero_orden_compra} · {compra.proveedor_nombre}
                  </span>
                </span>
                <span className="text-sm text-text-muted">
                  {compra.cantidad} · ${compra.valor_total.toLocaleString('es-CL')} · {formatearFecha(compra.fecha_compra)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
