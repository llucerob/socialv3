import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { listarProductos } from '@/lib/inventario/dal'

const ROLES_INVENTARIO = ['administrador', 'bodega_logistica'] as const

// US-11.04: "ver stock disponible" · "se muestra listado de productos" ·
// "se muestra stock actual" · "se muestra stock mínimo" · "se identifican
// productos con bajo stock".
export default async function InventarioPage() {
  await requireRole([...ROLES_INVENTARIO])
  const productos = await listarProductos()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Inventario</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/inventario/proveedores"
            className="rounded border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/20"
          >
            Proveedores
          </Link>
          <Link
            href="/inventario/compras"
            className="rounded border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/20"
          >
            Compras
          </Link>
          <Link
            href="/inventario/nuevo"
            className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Nuevo producto
          </Link>
        </div>
      </div>

      {productos.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin productos registrados.</p>
      ) : (
        <ul className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
          {productos.map((producto) => {
            const bajoStock = producto.stock_actual <= producto.stock_minimo
            return (
              <li key={producto.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-medium">{producto.nombre}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {producto.categoria} · {producto.unidad_medida}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className={bajoStock ? 'font-medium text-red-600' : 'font-medium'}>
                      {producto.stock_actual} {producto.unidad_medida}
                    </p>
                    <p className="text-zinc-500 dark:text-zinc-400">mínimo {producto.stock_minimo}</p>
                  </div>
                  {bajoStock && (
                    <span className="rounded bg-red-600/10 px-2 py-1 text-xs font-medium text-red-600">
                      Stock bajo
                    </span>
                  )}
                  <Link
                    href={`/inventario/${producto.id}/entrada`}
                    className="rounded border border-black/10 px-3 py-1.5 text-sm font-medium dark:border-white/20"
                  >
                    Registrar entrada
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
