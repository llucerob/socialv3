import Link from 'next/link'
import { getProfile } from '@/lib/auth/dal'
import { listarMotivosEntregaFallida } from '@/lib/motivos-entrega/dal'
import { ButtonLink } from '@/components/ui/Button'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { tieneRol } from '@/lib/auth/roles'

// US-19.03: "se pueden crear/activar/desactivar motivos [de entrega fallida]".
export default async function MotivosEntregaFallidaPage() {
  const profile = await getProfile()
  const motivos = await listarMotivosEntregaFallida()
  const puedeGestionar = tieneRol(profile, ['administrador'])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Motivos de entrega fallida</h1>
        {puedeGestionar && <ButtonLink href="/admin/motivos-entrega/nuevo">Nuevo motivo</ButtonLink>}
      </div>

      {motivos.length === 0 ? (
        <p className="text-sm text-text-muted">Sin motivos registrados.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {motivos.map((motivo) => (
            <li key={motivo.id}>
              <Link
                href={`/admin/motivos-entrega/${motivo.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface-alt"
              >
                <span className="font-medium text-text-primary">{motivo.nombre}</span>
                <EstadoBadge estado={motivo.estado} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
