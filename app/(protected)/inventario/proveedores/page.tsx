import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { listarProveedores } from '@/lib/proveedores/dal'

const ROLES_PROVEEDORES = ['administrador', 'bodega_logistica'] as const

// US-24.01: "registro de nombre, RUT, contacto; listado de proveedores activos".
export default async function ProveedoresPage() {
  await requireRole([...ROLES_PROVEEDORES])
  const proveedores = await listarProveedores()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Proveedores</h1>
        <Link
          href="/inventario/proveedores/nuevo"
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Nuevo proveedor
        </Link>
      </div>

      {proveedores.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin proveedores registrados.</p>
      ) : (
        <ul className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
          {proveedores.map((proveedor) => (
            <li key={proveedor.id}>
              <Link
                href={`/inventario/proveedores/${proveedor.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <span>
                  <span className="font-medium">{proveedor.nombre}</span>
                  <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">{proveedor.rut}</span>
                </span>
                <span className="text-xs uppercase text-zinc-500 dark:text-zinc-400">{proveedor.estado}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
