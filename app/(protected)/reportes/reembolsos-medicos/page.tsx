import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { reporteReembolsosMedicos } from '@/lib/reportes/dal'
import { TIPO_REEMBOLSO_LABELS, type TipoReembolsoFiltro } from '@/lib/reportes/types'
import { ButtonLink } from '@/components/ui/Button'
import { FiltrosBar, CampoFiltro } from '@/components/ui/FiltrosBar'
import { BadgeExcepcion } from '@/components/ui/ExcepcionRSH'

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
  const claseCampo = 'rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-text-primary">Reembolsos médicos</h1>
        <ButtonLink
          href={`/api/reportes/reembolsos-medicos/export${queryExport ? `?${queryExport}` : ''}`}
          variante="secondary"
        >
          Exportar CSV
        </ButtonLink>
      </div>

      <FiltrosBar hrefLimpiar={hayFiltros ? '/reportes/reembolsos-medicos' : undefined}>
        <CampoFiltro label="Desde" htmlFor="fecha_desde">
          <input type="date" id="fecha_desde" name="fecha_desde" defaultValue={fecha_desde} className={claseCampo} />
        </CampoFiltro>
        <CampoFiltro label="Hasta" htmlFor="fecha_hasta">
          <input type="date" id="fecha_hasta" name="fecha_hasta" defaultValue={fecha_hasta} className={claseCampo} />
        </CampoFiltro>
        <CampoFiltro label="Tipo de reembolso" htmlFor="tipo_reembolso">
          <select id="tipo_reembolso" name="tipo_reembolso" defaultValue={tipo_reembolso} className={claseCampo}>
            <option value="">Todos</option>
            <option value="general">{TIPO_REEMBOLSO_LABELS.general}</option>
            <option value="dialisis">{TIPO_REEMBOLSO_LABELS.dialisis}</option>
          </select>
        </CampoFiltro>
      </FiltrosBar>

      <p className="text-sm text-text-muted">
        {filas.length} {filas.length === 1 ? 'reembolso' : 'reembolsos'}
      </p>

      {filas.length === 0 ? (
        <p className="text-sm text-text-muted">Sin reembolsos para este filtro.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {filas.map((fila) => (
            <li key={fila.solicitud_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <span className="text-text-muted">{fila.fecha_solicitud}</span>
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
                {fila.es_excepcion && (
                  <span className="mt-1 inline-block">
                    <BadgeExcepcion />
                  </span>
                )}
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
