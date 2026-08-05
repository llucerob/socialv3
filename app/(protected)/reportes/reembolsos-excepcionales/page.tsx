import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { reporteReembolsosExcepcionales } from '@/lib/reportes/dal'
import { TIPO_EXCEPCION_LABELS, type TipoExcepcionFiltro } from '@/lib/reportes/types'

const ROLES_REPORTE = ['administrador', 'finanzas'] as const

type SearchParams = {
  fecha_desde?: string
  fecha_hasta?: string
  tipo_excepcion?: string
}

function esTipoExcepcionValido(valor: string): valor is TipoExcepcionFiltro {
  return valor === 'cirugia' || valor === 'fallecimiento'
}

// US-25.07: "reembolsos excepcionales por cirugía y fallecimiento... se
// muestran por separado de los reembolsos generales y de diálisis ·
// filtrable por tipo (cirugía / fallecimiento) y por período".
export default async function ReporteReembolsosExcepcionalesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireRole([...ROLES_REPORTE])
  const { fecha_desde = '', fecha_hasta = '', tipo_excepcion = '' } = await searchParams
  const tipoExcepcion = esTipoExcepcionValido(tipo_excepcion) ? tipo_excepcion : undefined

  const filas = await reporteReembolsosExcepcionales({
    fechaDesde: fecha_desde || undefined,
    fechaHasta: fecha_hasta || undefined,
    tipoExcepcion,
  })

  const hayFiltros = fecha_desde || fecha_hasta || tipo_excepcion
  const queryExport = new URLSearchParams(
    Object.entries({ fecha_desde, fecha_hasta, tipo_excepcion }).filter(([, valor]) => valor)
  ).toString()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Reembolsos excepcionales</h1>
        <a
          href={`/api/reportes/reembolsos-excepcionales/export${queryExport ? `?${queryExport}` : ''}`}
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
          <label htmlFor="tipo_excepcion" className="text-sm font-medium">
            Tipo de excepción
          </label>
          <select
            id="tipo_excepcion"
            name="tipo_excepcion"
            defaultValue={tipo_excepcion}
            className="rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          >
            <option value="">Todos</option>
            <option value="cirugia">{TIPO_EXCEPCION_LABELS.cirugia}</option>
            <option value="fallecimiento">{TIPO_EXCEPCION_LABELS.fallecimiento}</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/20"
        >
          Filtrar
        </button>
        {hayFiltros && (
          <Link href="/reportes/reembolsos-excepcionales" className="text-sm text-zinc-500 underline dark:text-zinc-400">
            Limpiar filtros
          </Link>
        )}
      </form>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {filas.length} {filas.length === 1 ? 'reembolso excepcional' : 'reembolsos excepcionales'}
      </p>

      {filas.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin reembolsos excepcionales para este filtro.</p>
      ) : (
        <ul className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
          {filas.map((fila) => (
            <li
              key={fila.solicitud_id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <span className="text-zinc-500 dark:text-zinc-400">{fila.fecha_solicitud}</span>
                <span className="mx-2">·</span>
                <span className="font-medium">{fila.tipo_reembolso_nombre}</span>
                <span className="mx-2">·</span>
                <span>{fila.direccion}</span>
                {fila.persona_nombre && <span className="mx-2">· {fila.persona_nombre}</span>}
                <div className="mt-1 text-zinc-500 dark:text-zinc-400">
                  Solicitado: {fila.monto_solicitado !== null ? `$${fila.monto_solicitado.toLocaleString('es-CL')}` : '—'}
                  {' · '}
                  Aprobado: {fila.monto_aprobado !== null ? `$${fila.monto_aprobado.toLocaleString('es-CL')}` : '—'}
                  {' · '}
                  Pagado: {fila.monto_pagado !== null ? `$${fila.monto_pagado.toLocaleString('es-CL')}` : '—'}
                </div>
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
