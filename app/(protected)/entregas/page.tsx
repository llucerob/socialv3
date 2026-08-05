import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { listarEntregas, listarFuncionariosTerreno } from '@/lib/entregas/dal'
import { ESTADO_ENTREGA_LABELS } from '@/lib/entregas/types'
import { asignarResponsableLote, moverEntregaEnRuta } from '@/lib/rutas/actions'
import { ordenarParaRuta } from '@/lib/rutas/geo'
import { enlaceMapa } from '@/lib/rutas/mapas'
import { AsignarLoteForm } from './asignar-lote-form'

const ROLES_LOGISTICA = ['administrador', 'bodega_logistica'] as const

// US-12.01/US-12.02: vista general de bodega/administrador sobre todas las
// entregas, para gestionar asignación y seguimiento. Cada fila enlaza al
// detalle de la solicitud, donde viven las acciones de crear/asignar/
// reprogramar una entrega individual (ver sección "Entrega" en
// solicitudes/[id]/page.tsx).
//
// US-13.01: agrega filtro por sector + selección múltiple + asignación
// masiva. US-13.04/US-13.02: al filtrar por sector, muestra además la ruta
// calculada (o pendiente de calcular) con ajuste manual de orden.
// US-13.03: enlace "Mapa" por entrega.
export default async function EntregasPage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string }>
}) {
  const profile = await requireRole([...ROLES_LOGISTICA])
  const { sector = '' } = await searchParams
  const todas = await listarEntregas()
  const sectores = [...new Set(todas.map((entrega) => entrega.grupo_familiar_sector).filter(Boolean))].sort()

  const entregas = sector ? todas.filter((entrega) => entrega.grupo_familiar_sector === sector) : todas
  const pendientesDelSector = sector
    ? ordenarParaRuta(entregas.filter((entrega) => entrega.estado === 'pendiente'))
    : []
  const funcionarios = sector ? await listarFuncionariosTerreno() : []

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Entregas</h1>

      <form className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="sector" className="text-sm font-medium">
            Sector
          </label>
          <select
            id="sector"
            name="sector"
            defaultValue={sector}
            className="rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          >
            <option value="">Todos los sectores</option>
            {sectores.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/20"
        >
          Filtrar
        </button>
        {sector && (
          <Link href="/entregas" className="text-sm text-zinc-500 underline dark:text-zinc-400">
            Ver todos
          </Link>
        )}
      </form>

      {entregas.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Sin entregas para este filtro. Se crean desde una solicitud aprobada.
        </p>
      ) : (
        <ul className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
          {entregas.map((entrega) => (
            <li key={entrega.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <Link href={`/solicitudes/${entrega.solicitud_id}`} className="min-w-0 flex-1 hover:underline">
                <span className="font-medium">{entrega.tipo_ayuda_nombre}</span>
                <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {entrega.grupo_familiar_direccion}
                  {entrega.persona_nombre ? ` · ${entrega.persona_nombre}` : ''}
                  {entrega.fecha_programada ? ` · programada ${entrega.fecha_programada}` : ''}
                  {' · '}
                  {entrega.responsable_nombre ?? 'sin asignar'}
                </span>
              </Link>
              <a
                href={enlaceMapa(entrega)}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-sm underline"
              >
                Mapa
              </a>
              <span className="shrink-0 text-xs uppercase text-zinc-500 dark:text-zinc-400">
                {ESTADO_ENTREGA_LABELS[entrega.estado]}
              </span>
            </li>
          ))}
        </ul>
      )}

      {sector && (
        <section className="space-y-4 rounded border border-black/10 p-4 dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-medium">Ruta del sector &quot;{sector}&quot;</h2>
            <div className="flex items-center gap-3">
              {profile.rol === 'administrador' && (
                <Link href="/rutas/configuracion" className="text-sm text-zinc-500 underline dark:text-zinc-400">
                  Configurar punto de origen
                </Link>
              )}
              <form action="/api/rutas/calcular-orden" method="post">
                <input type="hidden" name="sector" value={sector} />
                <button
                  type="submit"
                  className="rounded bg-foreground px-3 py-1.5 text-sm font-medium text-background"
                >
                  Calcular orden por cercanía
                </button>
              </form>
            </div>
          </div>

          {pendientesDelSector.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin entregas pendientes en este sector.</p>
          ) : (
            <>
              <AsignarLoteForm action={asignarResponsableLote} funcionarios={funcionarios} />

              <ol className="space-y-2">
                {pendientesDelSector.map((entrega, index) => {
                  const moverArribaConId = moverEntregaEnRuta.bind(null, entrega.id, 'arriba')
                  const moverAbajoConId = moverEntregaEnRuta.bind(null, entrega.id, 'abajo')

                  return (
                    <li
                      key={entrega.id}
                      className="flex flex-wrap items-center gap-3 rounded border border-black/10 p-3 text-sm dark:border-white/10"
                    >
                      <input type="checkbox" name="entrega_id" value={entrega.id} form="asignar-lote" />
                      <span className="text-zinc-500 dark:text-zinc-400">#{index + 1}</span>
                      <span className="min-w-0 flex-1">
                        {entrega.grupo_familiar_direccion}
                        {(entrega.grupo_familiar_latitud === null || entrega.grupo_familiar_longitud === null) && (
                          <span className="ml-2 rounded-full border border-amber-600/30 bg-amber-600/10 px-2 py-0.5 text-xs whitespace-nowrap text-amber-700 dark:text-amber-500">
                            Sin georreferenciar
                          </span>
                        )}
                        {' · '}
                        {entrega.responsable_nombre ?? 'sin asignar'}
                      </span>
                      <a
                        href={enlaceMapa(entrega)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Mapa
                      </a>
                      <form action={moverArribaConId}>
                        <input type="hidden" name="sector" value={sector} />
                        <button
                          type="submit"
                          disabled={index === 0}
                          aria-label="Mover arriba"
                          className="rounded border border-black/10 px-2 py-1 disabled:opacity-30 dark:border-white/20"
                        >
                          ▲
                        </button>
                      </form>
                      <form action={moverAbajoConId}>
                        <input type="hidden" name="sector" value={sector} />
                        <button
                          type="submit"
                          disabled={index === pendientesDelSector.length - 1}
                          aria-label="Mover abajo"
                          className="rounded border border-black/10 px-2 py-1 disabled:opacity-30 dark:border-white/20"
                        >
                          ▼
                        </button>
                      </form>
                    </li>
                  )
                })}
              </ol>
            </>
          )}
        </section>
      )}
    </div>
  )
}
