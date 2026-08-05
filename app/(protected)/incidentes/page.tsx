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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Incidentes de seguridad</h1>
        {puedeGestionar && (
          <Link
            href="/incidentes/nuevo"
            className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Registrar incidente
          </Link>
        )}
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
          <label htmlFor="tipo" className="text-sm font-medium">
            Tipo
          </label>
          <select
            id="tipo"
            name="tipo"
            defaultValue={tipo}
            className="rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          >
            <option value="">Todos</option>
            {TIPOS_INCIDENTE.map((t) => (
              <option key={t} value={t}>
                {TIPO_INCIDENTE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="estado" className="text-sm font-medium">
            Estado
          </label>
          <select
            id="estado"
            name="estado"
            defaultValue={estado}
            className="rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          >
            <option value="">Todos</option>
            {ESTADOS_INCIDENTE.map((e) => (
              <option key={e} value={e}>
                {ESTADO_INCIDENTE_LABELS[e]}
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
          <Link href="/incidentes" className="text-sm text-zinc-500 underline dark:text-zinc-400">
            Limpiar filtros
          </Link>
        )}
      </form>

      {incidentes.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin incidentes para este filtro.</p>
      ) : (
        <ul className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
          {incidentes.map((incidente) => (
            <li key={incidente.id}>
              <Link
                href={`/incidentes/${incidente.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">{incidente.fecha_incidente}</span>
                  <span className="mx-2">·</span>
                  <span className="font-medium">{TIPO_INCIDENTE_LABELS[incidente.tipo]}</span>
                  <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {incidente.cantidad_personas_afectadas} persona
                    {incidente.cantidad_personas_afectadas === 1 ? '' : 's'} afectada
                    {incidente.cantidad_personas_afectadas === 1 ? '' : 's'}
                  </span>
                </span>
                <span className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
                  {ESTADO_INCIDENTE_LABELS[incidente.estado]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
