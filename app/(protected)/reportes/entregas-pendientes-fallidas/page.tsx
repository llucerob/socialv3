import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { reporteEntregasPendientesFallidas, listarSectoresDisponibles } from '@/lib/reportes/dal'
import { listarFuncionariosTerreno } from '@/lib/entregas/dal'
import { ESTADO_ENTREGA_FILTRO_LABELS, type EstadoEntregaFiltroReporte } from '@/lib/reportes/types'
import { ButtonLink } from '@/components/ui/Button'
import { FiltrosBar, CampoFiltro } from '@/components/ui/FiltrosBar'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { formatearFecha } from '@/lib/fechas'

const ROLES_REPORTE = ['administrador', 'bodega_logistica'] as const

type SearchParams = {
  estado?: string
  responsable_id?: string
  sector?: string
}

function esEstadoValido(valor: string): valor is EstadoEntregaFiltroReporte {
  return valor === 'pendiente' || valor === 'fallida'
}

// US-17.05: "entregas pendientes y fallidas, para gestionar
// reprogramaciones... se listan pendientes y fallidas... filtrar por
// responsable y por sector... ver motivo de falla".
export default async function ReporteEntregasPendientesFallidasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireRole([...ROLES_REPORTE])
  const { estado = '', responsable_id = '', sector = '' } = await searchParams
  const estadoFiltro = esEstadoValido(estado) ? estado : undefined

  const [filas, funcionarios, sectores] = await Promise.all([
    reporteEntregasPendientesFallidas({
      estado: estadoFiltro,
      responsableId: responsable_id || undefined,
      sector: sector || undefined,
    }),
    listarFuncionariosTerreno(),
    listarSectoresDisponibles(),
  ])

  const hayFiltros = estado || responsable_id || sector
  const queryExport = new URLSearchParams(
    Object.entries({ estado, responsable_id, sector }).filter(([, valor]) => valor)
  ).toString()
  const claseCampo = 'rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-text-primary">Entregas pendientes y fallidas</h1>
        <ButtonLink
          href={`/api/reportes/entregas-pendientes-fallidas/export${queryExport ? `?${queryExport}` : ''}`}
          variante="secondary"
        >
          Exportar CSV
        </ButtonLink>
      </div>

      <FiltrosBar hrefLimpiar={hayFiltros ? '/reportes/entregas-pendientes-fallidas' : undefined}>
        <CampoFiltro label="Estado" htmlFor="estado">
          <select id="estado" name="estado" defaultValue={estado} className={claseCampo}>
            <option value="">Pendientes y fallidas</option>
            <option value="pendiente">{ESTADO_ENTREGA_FILTRO_LABELS.pendiente}</option>
            <option value="fallida">{ESTADO_ENTREGA_FILTRO_LABELS.fallida}</option>
          </select>
        </CampoFiltro>
        <CampoFiltro label="Responsable" htmlFor="responsable_id">
          <select id="responsable_id" name="responsable_id" defaultValue={responsable_id} className={claseCampo}>
            <option value="">Todos</option>
            {funcionarios.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre}
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
        {filas.length} {filas.length === 1 ? 'entrega' : 'entregas'}
      </p>

      {filas.length === 0 ? (
        <p className="text-sm text-text-muted">Sin entregas pendientes o fallidas para este filtro.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {filas.map((fila) => (
            <li key={fila.entrega_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <span className="font-medium text-text-primary">{fila.tipo_ayuda_nombre}</span>
                <span className="mx-2">·</span>
                <span className="text-text-primary">
                  {fila.direccion} ({fila.sector})
                </span>
                <span className="mx-2">·</span>
                <span className="text-text-muted">{fila.responsable_nombre ?? 'sin asignar'}</span>
                {fila.fecha_programada && (
                  <span className="mx-2 text-text-muted">· programada {formatearFecha(fila.fecha_programada)}</span>
                )}
                {fila.motivo_fallo && (
                  <div className="mt-1 text-text-muted">
                    Motivo de falla: {fila.motivo_fallo}
                    {fila.observacion_fallo && ` — ${fila.observacion_fallo}`}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <EstadoBadge estado={fila.estado as EstadoEntregaFiltroReporte} />
                <Link href={fila.ruta} className="text-sm text-brand-600 hover:underline">
                  Ver
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
