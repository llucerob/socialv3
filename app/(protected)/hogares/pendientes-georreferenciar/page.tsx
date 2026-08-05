import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { listarHogaresPendientesGeoreferenciar } from '@/lib/hogares/dal'
import { HogaresPendientesRealtime } from './hogares-pendientes-realtime'

const ROLES = ['administrador', 'bodega_logistica'] as const

// US-13.05: "como logística o administrador, quiero ver un listado de
// hogares sin coordenadas registradas, para priorizar su regularización y
// mejorar progresivamente la calidad del ruteo automático" (US-13.04).
export default async function HogaresPendientesGeoreferenciarPage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string }>
}) {
  await requireRole([...ROLES])
  const { sector = '' } = await searchParams
  const hogares = await listarHogaresPendientesGeoreferenciar(sector || undefined)

  return (
    <div className="space-y-6">
      <HogaresPendientesRealtime />

      <div>
        <h1 className="text-2xl font-semibold">Hogares pendientes de georreferenciar</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Hogares sin coordenadas registradas (US-03.06). Regularízalos para mejorar el cálculo automático de rutas
          (US-13.04).
        </p>
      </div>

      <form className="flex gap-2">
        <input
          type="search"
          name="sector"
          defaultValue={sector}
          placeholder="Filtrar por sector…"
          className="w-full max-w-sm rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
        />
        <button
          type="submit"
          className="rounded border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/20"
        >
          Filtrar
        </button>
        {sector && (
          <Link
            href="/hogares/pendientes-georreferenciar"
            className="flex items-center text-sm text-zinc-500 underline dark:text-zinc-400"
          >
            Ver todos
          </Link>
        )}
      </form>

      {hogares.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No hay hogares pendientes de georreferenciar{sector ? ' en este sector' : ''}.
        </p>
      ) : (
        <ul className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
          {hogares.map((hogar) => (
            <li key={hogar.id}>
              <Link
                href={`/hogares/${hogar.id}/editar`}
                className="flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <span>
                  <span className="font-medium">{hogar.direccion}</span>
                  <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">{hogar.sector}</span>
                </span>
                <span className="rounded-full border border-amber-600/30 bg-amber-600/10 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-500">
                  Pendiente
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
