import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { listarCompras } from '@/lib/compras/dal'

const ROLES_COMPRAS = ['administrador', 'bodega_logistica'] as const

// US-24.02: "registrar compra municipal" — listado de compras registradas.
export default async function ComprasPage() {
  await requireRole([...ROLES_COMPRAS])
  const compras = await listarCompras()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Compras</h1>
        <Link
          href="/inventario/compras/nueva"
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Nueva compra
        </Link>
      </div>

      {compras.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin compras registradas.</p>
      ) : (
        <ul className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
          {compras.map((compra) => (
            <li key={compra.id}>
              <Link
                href={`/inventario/compras/${compra.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <span>
                  <span className="font-medium">{compra.producto_nombre}</span>
                  <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                    OC {compra.numero_orden_compra} · {compra.proveedor_nombre}
                  </span>
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {compra.cantidad} · ${compra.valor_total.toLocaleString('es-CL')} · {compra.fecha_compra}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
