import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { listarMisEntregas } from '@/lib/entregas/dal'
import { ordenarParaRuta } from '@/lib/rutas/geo'
import { enlaceMapa } from '@/lib/rutas/mapas'

const ROLES = ['administrador', 'terreno_repartidor'] as const

// US-13.01 ("las entregas quedan agrupadas para terreno" — agrupación por
// sector) + US-13.02/US-13.04 (orden ya calculado y/o ajustado, ver
// lib/rutas/geo.ts) + US-13.03 (abrir dirección en mapas). Vista de solo
// lectura: registrar el resultado (realizada/fallida) sigue viviendo en
// /mis-entregas/[id] (EPIC 12), para no duplicar esos formularios en dos
// lugares.
export default async function RutasPage() {
  await requireRole([...ROLES])
  const entregas = await listarMisEntregas()
  const pendientes = ordenarParaRuta(entregas.filter((entrega) => entrega.estado === 'pendiente'))

  const porSector = new Map<string, typeof pendientes>()
  for (const entrega of pendientes) {
    const lista = porSector.get(entrega.grupo_familiar_sector) ?? []
    lista.push(entrega)
    porSector.set(entrega.grupo_familiar_sector, lista)
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Mi ruta</h1>

      {pendientes.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No tienes entregas pendientes.</p>
      ) : (
        Array.from(porSector.entries()).map(([sector, entregasSector]) => (
          <section key={sector} className="space-y-3">
            <h2 className="font-medium">{sector}</h2>
            <ol className="space-y-2">
              {entregasSector.map((entrega, index) => (
                <li key={entrega.id} className="rounded border border-black/10 p-4 dark:border-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Parada {index + 1}</p>
                      <p className="font-medium">{entrega.grupo_familiar_direccion}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {entrega.tipo_ayuda_nombre}
                        {entrega.persona_nombre ? ` · ${entrega.persona_nombre}` : ''}
                      </p>
                      {(entrega.grupo_familiar_latitud === null || entrega.grupo_familiar_longitud === null) && (
                        <span className="mt-1 inline-block rounded-full border border-amber-600/30 bg-amber-600/10 px-2 py-0.5 text-xs whitespace-nowrap text-amber-700 dark:text-amber-500">
                          Sin georreferenciar
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/mis-entregas/${entrega.id}`}
                      className="shrink-0 rounded border border-black/10 px-3 py-1.5 text-sm font-medium dark:border-white/20"
                    >
                      Ver
                    </Link>
                  </div>
                  <a
                    href={enlaceMapa(entrega)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm underline"
                  >
                    Abrir en mapas
                  </a>
                </li>
              ))}
            </ol>
          </section>
        ))
      )}
    </div>
  )
}
