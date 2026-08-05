import Link from 'next/link'
import { getProfile } from '@/lib/auth/dal'
import { listarSectores } from '@/lib/sectores/dal'

// US-19.02: "se pueden crear/editar/desactivar sectores".
export default async function SectoresPage() {
  const profile = await getProfile()
  const sectores = await listarSectores()
  const puedeGestionar = profile.rol === 'administrador'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sectores</h1>
        {puedeGestionar && (
          <Link
            href="/admin/sectores/nuevo"
            className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Nuevo sector
          </Link>
        )}
      </div>

      {sectores.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin sectores registrados.</p>
      ) : (
        <ul className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
          {sectores.map((sector) => (
            <li key={sector.id}>
              <Link
                href={`/admin/sectores/${sector.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <span className="font-medium">{sector.nombre}</span>
                <span className="text-xs uppercase text-zinc-500 dark:text-zinc-400">{sector.estado}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
