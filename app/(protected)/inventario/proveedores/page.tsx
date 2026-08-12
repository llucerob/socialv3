import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { listarProveedores } from '@/lib/proveedores/dal'
import { ButtonLink } from '@/components/ui/Button'
import { EstadoBadge } from '@/components/ui/EstadoBadge'

const ROLES_PROVEEDORES = ['administrador', 'bodega_logistica'] as const

// US-24.01: "registro de nombre, RUT, contacto; listado de proveedores activos".
export default async function ProveedoresPage() {
  await requireRole([...ROLES_PROVEEDORES])
  const proveedores = await listarProveedores()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Proveedores</h1>
        <ButtonLink href="/inventario/proveedores/nuevo">Nuevo proveedor</ButtonLink>
      </div>

      {proveedores.length === 0 ? (
        <p className="text-sm text-text-muted">Sin proveedores registrados.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {proveedores.map((proveedor) => (
            <li key={proveedor.id}>
              <Link
                href={`/inventario/proveedores/${proveedor.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface-alt"
              >
                <span>
                  <span className="font-medium text-text-primary">{proveedor.nombre}</span>
                  <span className="ml-2 text-sm text-text-muted">{proveedor.rut}</span>
                </span>
                <EstadoBadge estado={proveedor.estado} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
