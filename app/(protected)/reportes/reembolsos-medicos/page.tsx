import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { reporteReembolsosMedicos } from '@/lib/reportes/dal'
import { TIPO_REEMBOLSO_LABELS, type TipoReembolsoFiltro } from '@/lib/reportes/types'

const ROLES_REPORTE = ['administrador', 'finanzas'] as const

type SearchParams = {
  fecha_desde?: string
  fecha_hasta?: string
  tipo_reembolso?: string
}

function esTipoReembolsoValido(valor: string): valor is TipoReembolsoFiltro {
  return valor === 'general' || valor === 'dialisis'
}

// US-17.03: "reembolsos médicos aprobados y pagados... monto solicitado,
// aprobado, pagado... filtrar por período y por tipo de reembolso".
export default async function ReporteReembolsosMedicosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireRole([...ROLES_REPORTE])
  const { fecha_desde = '', fecha_hasta = '', tipo_reembolso = '' } = await searchParams
  const tipoReembolso = esTipoReembolsoValido(tipo_reembolso) ? tipo_reembolso : undefined

  const filas = await reporteReembolsosMedicos({
    fechaDesde: fecha_desde || undefined,
    fechaHasta: fecha_hasta || undefined,
    tipoReembolso,
  })

  const hayFiltros = fecha_desde || fecha_hasta || tipo_reembolso
  const queryExport = new URLSearchParams(
    Object.entries({ fecha_desde, fecha_hasta, tipo_reembolso }).filter(([, valor]) => valor)
  ).toString()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Reembolsos médicos</h1>
        <a
          href={`/api/reportes/reembolsos-medicos/export${queryExport ? `?${queryExport}` : ''}`}
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
          <label htmlFor="tipo_reembolso" className="text-sm font-medium">
            Tipo de reembolso
          </label>
          <select
            id="tipo_reembolso"
            name="tipo_reembolso"
            defaultValue={tipo_reembolso}
            className="rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          >
            <option value="">Todos</option>
            <option value="general">{TIPO_REEMBOLSO_LABELS.general}</option>
            <option value="dialisis">{TIPO_REEMBOLSO_LABELS.dialisis}</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/20"
        >
          Filtrar
        </button>
        {hayFiltros && (
          <Link href="/reportes/reembolsos-medicos" className="text-sm text-zinc-500 underline dark:text-zinc-400">
            Limpiar filtros
          </Link>
        )}
      </form>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {filas.length} {filas.length === 1 ? 'reembolso' : 'reembolsos'}
      </p>

      {filas.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin reembolsos para este filtro.</p>
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
                {fila.es_excepcion && (
                  <span className="mt-1 inline-block rounded-full border border-amber-600/30 bg-amber-600/10 px-2 py-0.5 text-xs whitespace-nowrap text-amber-700 dark:text-amber-500">
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
