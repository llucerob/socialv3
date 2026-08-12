import { requireRole } from '@/lib/auth/dal'
import { listarProductos } from '@/lib/inventario/dal'
import { ButtonLink } from '@/components/ui/Button'

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
        <h1 className="text-2xl font-semibold text-text-primary">Inventario</h1>
        <div className="flex items-center gap-2">
          <ButtonLink href="/inventario/proveedores" variante="secondary">
            Proveedores
          </ButtonLink>
          <ButtonLink href="/inventario/compras" variante="secondary">
            Compras
          </ButtonLink>
          <ButtonLink href="/inventario/nuevo">Nuevo producto</ButtonLink>
        </div>
      </div>

      {productos.length === 0 ? (
        <p className="text-sm text-text-muted">Sin productos registrados.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {productos.map((producto) => {
            const bajoStock = producto.stock_actual <= producto.stock_minimo
            return (
              <li key={producto.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-medium text-text-primary">{producto.nombre}</p>
                  <p className="text-sm text-text-muted">
                    {producto.categoria} · {producto.unidad_medida}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className={bajoStock ? 'font-medium text-danger-fg' : 'font-medium text-text-primary'}>
                      {producto.stock_actual} {producto.unidad_medida}
                    </p>
                    <p className="text-text-muted">mínimo {producto.stock_minimo}</p>
                  </div>
                  {bajoStock && (
                    <span className="rounded-full bg-danger-bg px-2.5 py-0.5 text-xs font-medium text-danger-fg">
                      Stock bajo
                    </span>
                  )}
                  <ButtonLink href={`/inventario/${producto.id}/entrada`} variante="secondary" className="px-3 py-1.5 text-sm">
                    Registrar entrada
                  </ButtonLink>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
