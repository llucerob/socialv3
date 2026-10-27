import Link from 'next/link'
import { getProfile } from '@/lib/auth/dal'
import { listarSectores } from '@/lib/sectores/dal'
import { ButtonLink } from '@/components/ui/Button'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { tieneRol } from '@/lib/auth/roles'

// US-19.02: "se pueden crear/editar/desactivar sectores".
export default async function SectoresPage() {
  const profile = await getProfile()
  const sectores = await listarSectores()
  const puedeGestionar = tieneRol(profile, ['administrador'])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Sectores</h1>
        {puedeGestionar && <ButtonLink href="/admin/sectores/nuevo">Nuevo sector</ButtonLink>}
      </div>

      {sectores.length === 0 ? (
        <p className="text-sm text-text-muted">Sin sectores registrados.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {sectores.map((sector) => (
            <li key={sector.id}>
              <Link
                href={`/admin/sectores/${sector.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface-alt"
              >
                <span className="font-medium text-text-primary">{sector.nombre}</span>
                <EstadoBadge estado={sector.estado} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
