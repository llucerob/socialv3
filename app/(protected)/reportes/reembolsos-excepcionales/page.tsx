import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { reporteReembolsosExcepcionales } from '@/lib/reportes/dal'
import { TIPO_EXCEPCION_LABELS, type TipoExcepcionFiltro } from '@/lib/reportes/types'
import { ButtonLink } from '@/components/ui/Button'
import { FiltrosBar, CampoFiltro } from '@/components/ui/FiltrosBar'
import { formatearFecha } from '@/lib/fechas'

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
  const claseCampo = 'rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-text-primary">Reembolsos excepcionales</h1>
        <ButtonLink
          href={`/api/reportes/reembolsos-excepcionales/export${queryExport ? `?${queryExport}` : ''}`}
          variante="secondary"
        >
          Exportar CSV
        </ButtonLink>
      </div>

      <FiltrosBar hrefLimpiar={hayFiltros ? '/reportes/reembolsos-excepcionales' : undefined}>
        <CampoFiltro label="Desde" htmlFor="fecha_desde">
          <input type="date" id="fecha_desde" name="fecha_desde" defaultValue={fecha_desde} className={claseCampo} />
        </CampoFiltro>
        <CampoFiltro label="Hasta" htmlFor="fecha_hasta">
          <input type="date" id="fecha_hasta" name="fecha_hasta" defaultValue={fecha_hasta} className={claseCampo} />
        </CampoFiltro>
        <CampoFiltro label="Tipo de excepción" htmlFor="tipo_excepcion">
          <select id="tipo_excepcion" name="tipo_excepcion" defaultValue={tipo_excepcion} className={claseCampo}>
            <option value="">Todos</option>
            <option value="cirugia">{TIPO_EXCEPCION_LABELS.cirugia}</option>
            <option value="fallecimiento">{TIPO_EXCEPCION_LABELS.fallecimiento}</option>
          </select>
        </CampoFiltro>
      </FiltrosBar>

      <p className="text-sm text-text-muted">
        {filas.length} {filas.length === 1 ? 'reembolso excepcional' : 'reembolsos excepcionales'}
      </p>

      {filas.length === 0 ? (
        <p className="text-sm text-text-muted">Sin reembolsos excepcionales para este filtro.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {filas.map((fila) => (
            <li key={fila.solicitud_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <span className="text-text-muted">{formatearFecha(fila.fecha_solicitud)}</span>
                <span className="mx-2">·</span>
                <span className="font-medium text-text-primary">{fila.tipo_reembolso_nombre}</span>
                <span className="mx-2">·</span>
                <span className="text-text-primary">{fila.direccion}</span>
                {fila.persona_nombre && <span className="mx-2 text-text-primary">· {fila.persona_nombre}</span>}
                <div className="mt-1 text-text-muted">
                  Solicitado: {fila.monto_solicitado !== null ? `$${fila.monto_solicitado.toLocaleString('es-CL')}` : '—'}
                  {' · '}
                  Aprobado: {fila.monto_aprobado !== null ? `$${fila.monto_aprobado.toLocaleString('es-CL')}` : '—'}
                  {' · '}
                  Pagado: {fila.monto_pagado !== null ? `$${fila.monto_pagado.toLocaleString('es-CL')}` : '—'}
                </div>
              </div>
              <Link href={fila.ruta} className="shrink-0 text-sm text-brand-600 hover:underline">
                Ver
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
