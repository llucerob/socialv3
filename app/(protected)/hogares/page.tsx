import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { buscarGruposFamiliares } from '@/lib/hogares/dal'
import { RshBadge } from './rsh-badge'
import { GeorreferenciacionBadge } from './georreferenciacion-badge'
import { tieneRol } from '@/lib/auth/roles'

// US-20.02: "terreno no ve historial completo del hogar" — terreno no tiene
// enlace de nav a este módulo (lib/dashboard/nav.ts), pero antes de esta
// historia la página no bloqueaba una navegación directa por URL. El resto
// de roles válidos mantiene exactamente el mismo acceso amplio que ya tenía.
const ROLES_VER_HOGARES = [
  'administrador',
  'evaluador_social',
  'aprobador',
  'bodega_logistica',
  'finanzas',
  'auditor_consulta',
] as const

export default async function HogaresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const profile = await requireRole([...ROLES_VER_HOGARES])
  const { q = '' } = await searchParams
  const hogares = await buscarGruposFamiliares(q)
  const puedeCrear = tieneRol(profile, ['administrador', 'evaluador_social'])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Grupos familiares</h1>
        {puedeCrear && (
          <Link
            href="/hogares/nuevo"
            className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Nuevo grupo familiar
          </Link>
        )}
      </div>

      <div>
        <form className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por dirección, sector, nombre o RUT de integrante…"
            className="w-full max-w-sm rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
          <button
            type="submit"
            className="rounded border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/20"
          >
            Buscar
          </button>
        </form>
      </div>

      {hogares.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin resultados.</p>
      ) : (
        <ul className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
          {hogares.map((hogar) => (
            <li key={hogar.id}>
              <Link
                href={`/hogares/${hogar.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <span>
                  <span className="font-medium">{hogar.direccion}</span>
                  <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {hogar.sector}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <RshBadge
                    tramoRsh={hogar.tramo_rsh}
                    fechaActualizacionRsh={hogar.fecha_actualizacion_rsh}
                  />
                  <GeorreferenciacionBadge latitud={hogar.latitud} longitud={hogar.longitud} />
                  <span className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
                    {hogar.estado}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
