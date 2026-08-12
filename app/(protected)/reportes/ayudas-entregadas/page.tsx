import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { reporteAyudasEntregadas, listarSectoresDisponibles } from '@/lib/reportes/dal'
import { listarTiposAyuda } from '@/lib/ayudas/dal'
import { ButtonLink } from '@/components/ui/Button'
import { FiltrosBar, CampoFiltro } from '@/components/ui/FiltrosBar'
import { BadgeExcepcion } from '@/components/ui/ExcepcionRSH'

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
  const claseCampo = 'rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-text-primary">Ayudas entregadas</h1>
        <ButtonLink
          href={`/api/reportes/ayudas-entregadas/export${queryExport ? `?${queryExport}` : ''}`}
          variante="secondary"
        >
          Exportar CSV
        </ButtonLink>
      </div>

      <FiltrosBar hrefLimpiar={hayFiltros ? '/reportes/ayudas-entregadas' : undefined}>
        <CampoFiltro label="Desde" htmlFor="fecha_desde">
          <input type="date" id="fecha_desde" name="fecha_desde" defaultValue={fecha_desde} className={claseCampo} />
        </CampoFiltro>
        <CampoFiltro label="Hasta" htmlFor="fecha_hasta">
          <input type="date" id="fecha_hasta" name="fecha_hasta" defaultValue={fecha_hasta} className={claseCampo} />
        </CampoFiltro>
        <CampoFiltro label="Tipo de ayuda" htmlFor="tipo_ayuda_id">
          <select id="tipo_ayuda_id" name="tipo_ayuda_id" defaultValue={tipo_ayuda_id} className={claseCampo}>
            <option value="">Todos</option>
            {tiposAyuda.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </CampoFiltro>
        <CampoFiltro label="Sector" htmlFor="sector">
          <select id="sector" name="sector" defaultValue={sector} className={claseCampo}>
            <option value="">Todos</option>
            {sectores.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </CampoFiltro>
      </FiltrosBar>

      <p className="text-sm text-text-muted">
        {filas.length} {filas.length === 1 ? 'ayuda entregada' : 'ayudas entregadas'}
      </p>

      {filas.length === 0 ? (
        <p className="text-sm text-text-muted">Sin ayudas entregadas para este filtro.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {filas.map((fila) => (
            <li key={fila.solicitud_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <span className="text-text-muted">{fila.fecha ?? '—'}</span>
                <span className="mx-2">·</span>
                <span className="font-medium text-text-primary">{fila.tipo_ayuda_nombre}</span>
                <span className="mx-2">·</span>
                <span className="text-text-primary">
                  {fila.direccion} ({fila.sector})
                </span>
                {fila.persona_nombre && <span className="mx-2 text-text-primary">· {fila.persona_nombre}</span>}
                {fila.monto !== null && <span className="mx-2 text-text-primary">· ${fila.monto.toLocaleString('es-CL')}</span>}
                {fila.es_excepcion && (
                  <span className="ml-2">
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
