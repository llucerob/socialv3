import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { listarIncidentes } from '@/lib/incidentes/dal'
import {
  TIPOS_INCIDENTE,
  TIPO_INCIDENTE_LABELS,
  ESTADOS_INCIDENTE,
  ESTADO_INCIDENTE_LABELS,
  type TipoIncidenteSeguridad,
  type EstadoIncidenteSeguridad,
} from '@/lib/incidentes/types'
import { ButtonLink } from '@/components/ui/Button'
import { FiltrosBar, CampoFiltro } from '@/components/ui/FiltrosBar'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { formatearFecha } from '@/lib/fechas'

// US-26.02: "acceso restringido a administrador/auditor".
const ROLES_VER_INCIDENTES = ['administrador', 'auditor_consulta'] as const
const ROLES_GESTION_INCIDENTES = ['administrador'] as const

type SearchParams = {
  fecha_desde?: string
  fecha_hasta?: string
  tipo?: string
  estado?: string
}

function esTipoValido(valor: string): valor is TipoIncidenteSeguridad {
  return (TIPOS_INCIDENTE as string[]).includes(valor)
}

function esEstadoValido(valor: string): valor is EstadoIncidenteSeguridad {
  return (ESTADOS_INCIDENTE as string[]).includes(valor)
}

// US-26.02: "listado filtrable por fecha, tipo y estado".
export default async function IncidentesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const profile = await requireRole([...ROLES_VER_INCIDENTES])
  const { fecha_desde = '', fecha_hasta = '', tipo = '', estado = '' } = await searchParams

  const incidentes = await listarIncidentes({
    fechaDesde: fecha_desde || undefined,
    fechaHasta: fecha_hasta || undefined,
    tipo: esTipoValido(tipo) ? tipo : undefined,
    estado: esEstadoValido(estado) ? estado : undefined,
  })

  const puedeGestionar = (ROLES_GESTION_INCIDENTES as readonly string[]).includes(profile.rol)
  const hayFiltros = fecha_desde || fecha_hasta || tipo || estado
  const claseCampo = 'rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Incidentes de seguridad</h1>
        {puedeGestionar && <ButtonLink href="/incidentes/nuevo">Registrar incidente</ButtonLink>}
      </div>

      <FiltrosBar hrefLimpiar={hayFiltros ? '/incidentes' : undefined}>
        <CampoFiltro label="Desde" htmlFor="fecha_desde">
          <input type="date" id="fecha_desde" name="fecha_desde" defaultValue={fecha_desde} className={claseCampo} />
        </CampoFiltro>
        <CampoFiltro label="Hasta" htmlFor="fecha_hasta">
          <input type="date" id="fecha_hasta" name="fecha_hasta" defaultValue={fecha_hasta} className={claseCampo} />
        </CampoFiltro>
        <CampoFiltro label="Tipo" htmlFor="tipo">
          <select id="tipo" name="tipo" defaultValue={tipo} className={claseCampo}>
            <option value="">Todos</option>
            {TIPOS_INCIDENTE.map((t) => (
              <option key={t} value={t}>
                {TIPO_INCIDENTE_LABELS[t]}
              </option>
            ))}
          </select>
        </CampoFiltro>
        <CampoFiltro label="Estado" htmlFor="estado">
          <select id="estado" name="estado" defaultValue={estado} className={claseCampo}>
            <option value="">Todos</option>
            {ESTADOS_INCIDENTE.map((e) => (
              <option key={e} value={e}>
                {ESTADO_INCIDENTE_LABELS[e]}
              </option>
            ))}
          </select>
        </CampoFiltro>
      </FiltrosBar>

      {incidentes.length === 0 ? (
        <p className="text-sm text-text-muted">Sin incidentes para este filtro.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {incidentes.map((incidente) => (
            <li key={incidente.id}>
              <Link
                href={`/incidentes/${incidente.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-surface-alt"
              >
                <span>
                  <span className="text-sm text-text-muted">{formatearFecha(incidente.fecha_incidente)}</span>
                  <span className="mx-2">·</span>
                  <span className="font-medium text-text-primary">{TIPO_INCIDENTE_LABELS[incidente.tipo]}</span>
                  <span className="ml-2 text-sm text-text-muted">
                    {incidente.cantidad_personas_afectadas} persona
                    {incidente.cantidad_personas_afectadas === 1 ? '' : 's'} afectada
                    {incidente.cantidad_personas_afectadas === 1 ? '' : 's'}
                  </span>
                </span>
                <EstadoBadge estado={incidente.estado} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
