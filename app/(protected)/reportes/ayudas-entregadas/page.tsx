import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { reporteAyudasEntregadas, listarSectoresDisponibles } from '@/lib/reportes/dal'
import { listarTiposAyuda } from '@/lib/ayudas/dal'

const ROLES_REPORTE = ['administrador', 'auditor_consulta'] as const

type SearchParams = {
  fecha_desde?: string
  fecha_hasta?: string
  tipo_ayuda_id?: string
  sector?: string
}

// US-17.01: "ver ayudas entregadas por período... filtrar por fecha, tipo de
// ayuda y sector... se muestra cantidad de ayudas... listado exportable"
// (exportación, US-17.06, vía el enlace a /api/reportes/.../export con los
// mismos filtros aplicados).
export default async function ReporteAyudasEntregadasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireRole([...ROLES_REPORTE])
  const { fecha_desde = '', fecha_hasta = '', tipo_ayuda_id = '', sector = '' } = await searchParams

  const [filas, tiposAyuda, sectores] = await Promise.all([
    reporteAyudasEntregadas({
      fechaDesde: fecha_desde || undefined,
      fechaHasta: fecha_hasta || undefined,
      tipoAyudaId: tipo_ayuda_id || undefined,
      sector: sector || undefined,
    }),
    listarTiposAyuda(),
    listarSectoresDisponibles(),
  ])

  const hayFiltros = fecha_desde || fecha_hasta || tipo_ayuda_id || sector
  const queryExport = new URLSearchParams(
    Object.entries({ fecha_desde, fecha_hasta, tipo_ayuda_id, sector }).filter(([, valor]) => valor)
  ).toString()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Ayudas entregadas</h1>
        <a
          href={`/api/reportes/ayudas-entregadas/export${queryExport ? `?${queryExport}` : ''}`}
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
          <label htmlFor="tipo_ayuda_id" className="text-sm font-medium">
            Tipo de ayuda
          </label>
          <select
            id="tipo_ayuda_id"
            name="tipo_ayuda_id"
            defaultValue={tipo_ayuda_id}
            className="rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          >
            <option value="">Todos</option>
            {tiposAyuda.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
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
          <Link href="/reportes/ayudas-entregadas" className="text-sm text-zinc-500 underline dark:text-zinc-400">
            Limpiar filtros
          </Link>
        )}
      </form>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {filas.length} {filas.length === 1 ? 'ayuda entregada' : 'ayudas entregadas'}
      </p>

      {filas.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin ayudas entregadas para este filtro.</p>
      ) : (
        <ul className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
          {filas.map((fila) => (
            <li
              key={fila.solicitud_id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <span className="text-zinc-500 dark:text-zinc-400">{fila.fecha ?? '—'}</span>
                <span className="mx-2">·</span>
                <span className="font-medium">{fila.tipo_ayuda_nombre}</span>
                <span className="mx-2">·</span>
                <span>
                  {fila.direccion} ({fila.sector})
                </span>
                {fila.persona_nombre && <span className="mx-2">· {fila.persona_nombre}</span>}
                {fila.monto !== null && <span className="mx-2">· ${fila.monto.toLocaleString('es-CL')}</span>}
                {fila.es_excepcion && (
                  <span className="ml-2 rounded-full border border-amber-600/30 bg-amber-600/10 px-2 py-0.5 text-xs whitespace-nowrap text-amber-700 dark:text-amber-500">
                    Excepción
                  </span>
                )}
              </div>
              <Link href={fila.ruta} className="shrink-0 text-sm underline">
                Ver
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
