import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { reporteHogaresBeneficiados, listarSectoresDisponibles } from '@/lib/reportes/dal'
import { ButtonLink } from '@/components/ui/Button'
import { FiltrosBar, CampoFiltro } from '@/components/ui/FiltrosBar'

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
  const claseCampo = 'rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-text-primary">Hogares beneficiados</h1>
        <ButtonLink
          href={`/api/reportes/hogares-beneficiados/export${queryExport ? `?${queryExport}` : ''}`}
          variante="secondary"
        >
          Exportar CSV
        </ButtonLink>
      </div>

      <FiltrosBar hrefLimpiar={hayFiltros ? '/reportes/hogares-beneficiados' : undefined}>
        <CampoFiltro label="Desde" htmlFor="fecha_desde">
          <input type="date" id="fecha_desde" name="fecha_desde" defaultValue={fecha_desde} className={claseCampo} />
        </CampoFiltro>
        <CampoFiltro label="Hasta" htmlFor="fecha_hasta">
          <input type="date" id="fecha_hasta" name="fecha_hasta" defaultValue={fecha_hasta} className={claseCampo} />
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
        {filas.length} {filas.length === 1 ? 'hogar beneficiado' : 'hogares beneficiados'}
      </p>

      {filas.length === 0 ? (
        <p className="text-sm text-text-muted">Sin hogares beneficiados para este filtro.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {filas.map((fila) => (
            <li
              key={fila.grupo_familiar_id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <span className="font-medium text-text-primary">{fila.direccion}</span>
                <span className="mx-2">·</span>
                <span className="text-text-primary">{fila.sector}</span>
                <span className="mx-2">·</span>
                <span className="text-text-primary">
                  {fila.cantidad_ayudas} {fila.cantidad_ayudas === 1 ? 'ayuda' : 'ayudas'}
                </span>
                {fila.fecha_ultima_ayuda && (
                  <span className="mx-2 text-text-muted">· última: {fila.fecha_ultima_ayuda}</span>
                )}
              </div>
              <Link href={fila.ruta} className="shrink-0 text-sm text-brand-600 hover:underline">
                Ver hogar
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
