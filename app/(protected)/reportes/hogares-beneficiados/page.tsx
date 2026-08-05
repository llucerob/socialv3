import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { reporteHogaresBeneficiados, listarSectoresDisponibles } from '@/lib/reportes/dal'

const ROLES_REPORTE = ['administrador', 'auditor_consulta'] as const

type SearchParams = {
  fecha_desde?: string
  fecha_hasta?: string
  sector?: string
}

// US-17.02: "hogares beneficiados... cantidad de hogares beneficiados...
// filtrar por período y por sector... ver detalle de ayudas por hogar". El
// detalle por hogar es la ficha ya existente /hogares/[id] (US-03.04 ya
// muestra su historial de ayudas) — este reporte agrega y enlaza, no lo
// duplica.
export default async function ReporteHogaresBeneficiadosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireRole([...ROLES_REPORTE])
  const { fecha_desde = '', fecha_hasta = '', sector = '' } = await searchParams

  const [filas, sectores] = await Promise.all([
    reporteHogaresBeneficiados({
      fechaDesde: fecha_desde || undefined,
      fechaHasta: fecha_hasta || undefined,
      sector: sector || undefined,
    }),
    listarSectoresDisponibles(),
  ])

  const hayFiltros = fecha_desde || fecha_hasta || sector
  const queryExport = new URLSearchParams(
    Object.entries({ fecha_desde, fecha_hasta, sector }).filter(([, valor]) => valor)
  ).toString()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Hogares beneficiados</h1>
        <a
          href={`/api/reportes/hogares-beneficiados/export${queryExport ? `?${queryExport}` : ''}`}
          className="rounded border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/20"
        >
          Exportar CSV
        </a>
      </div>

      <form className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="fecha_desde" className="text-sm font-medium">
            Desde
          </label>
          <input
            type="date"
            id="fecha_desde"
            name="fecha_desde"
            defaultValue={fecha_desde}
            className="rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="fecha_hasta" className="text-sm font-medium">
            Hasta
          </label>
          <input
            type="date"
            id="fecha_hasta"
            name="fecha_hasta"
            defaultValue={fecha_hasta}
            className="rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
        </div>
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
            <option value="">Todos</option>
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
        {hayFiltros && (
          <Link href="/reportes/hogares-beneficiados" className="text-sm text-zinc-500 underline dark:text-zinc-400">
            Limpiar filtros
          </Link>
        )}
      </form>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {filas.length} {filas.length === 1 ? 'hogar beneficiado' : 'hogares beneficiados'}
      </p>

      {filas.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin hogares beneficiados para este filtro.</p>
      ) : (
        <ul className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
          {filas.map((fila) => (
            <li
              key={fila.grupo_familiar_id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <span className="font-medium">{fila.direccion}</span>
                <span className="mx-2">·</span>
                <span>{fila.sector}</span>
                <span className="mx-2">·</span>
                <span>
                  {fila.cantidad_ayudas} {fila.cantidad_ayudas === 1 ? 'ayuda' : 'ayudas'}
                </span>
                {fila.fecha_ultima_ayuda && (
                  <span className="mx-2 text-zinc-500 dark:text-zinc-400">
                    · última: {fila.fecha_ultima_ayuda}
                  </span>
                )}
              </div>
              <Link href={fila.ruta} className="shrink-0 text-sm underline">
                Ver hogar
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
