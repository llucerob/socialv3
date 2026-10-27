import Link from 'next/link'
import { getProfile } from '@/lib/auth/dal'
import { listarTiposAyuda } from '@/lib/ayudas/dal'
import { ButtonLink } from '@/components/ui/Button'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { tieneRol } from '@/lib/auth/roles'

export default async function AyudasPage() {
  const profile = await getProfile()
  const tipos = await listarTiposAyuda()
  const puedeGestionar = tieneRol(profile, ['administrador'])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Catálogo de ayudas</h1>
        {puedeGestionar && (
          <ButtonLink href="/ayudas/nuevo">Nuevo tipo de ayuda</ButtonLink>
        )}
      </div>

      {tipos.length === 0 ? (
        <p className="text-sm text-text-muted">Sin tipos de ayuda registrados.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {tipos.map((tipoAyuda) => (
            <li key={tipoAyuda.id}>
              <Link
                href={`/ayudas/${tipoAyuda.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface-alt"
              >
                <span className="min-w-0">
                  <span className="font-medium text-text-primary">{tipoAyuda.nombre}</span>
                  <span className="ml-2 text-sm text-text-muted">{tipoAyuda.tipo}</span>
                  {tipoAyuda.tiene_tope_monetario && tipoAyuda.tope_monetario !== null && (
                    <span className="block text-xs text-text-muted">
                      Tope: ${tipoAyuda.tope_monetario.toLocaleString('es-CL')}
                    </span>
                  )}
                </span>
                <EstadoBadge estado={tipoAyuda.estado} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
