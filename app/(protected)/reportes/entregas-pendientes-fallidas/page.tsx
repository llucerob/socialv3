import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { reporteEntregasPendientesFallidas, listarSectoresDisponibles } from '@/lib/reportes/dal'
import { listarFuncionariosTerreno } from '@/lib/entregas/dal'
import { ESTADO_ENTREGA_FILTRO_LABELS, type EstadoEntregaFiltroReporte } from '@/lib/reportes/types'

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Entregas pendientes y fallidas</h1>
        <a
          href={`/api/reportes/entregas-pendientes-fallidas/export${queryExport ? `?${queryExport}` : ''}`}
          className="rounded border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/20"
        >
          Exportar CSV
        </a>
      </div>

      <form className="flex flex-wrap items-end gap-3">
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
            <option value="">Pendientes y fallidas</option>
            <option value="pendiente">{ESTADO_ENTREGA_FILTRO_LABELS.pendiente}</option>
            <option value="fallida">{ESTADO_ENTREGA_FILTRO_LABELS.fallida}</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="responsable_id" className="text-sm font-medium">
            Responsable
          </label>
          <select
            id="responsable_id"
            name="responsable_id"
            defaultValue={responsable_id}
            className="rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          >
            <option value="">Todos</option>
            {funcionarios.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre}
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
          <Link
            href="/reportes/entregas-pendientes-fallidas"
            className="text-sm text-zinc-500 underline dark:text-zinc-400"
          >
            Limpiar filtros
          </Link>
        )}
      </form>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {filas.length} {filas.length === 1 ? 'entrega' : 'entregas'}
      </p>

      {filas.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin entregas pendientes o fallidas para este filtro.</p>
      ) : (
        <ul className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
          {filas.map((fila) => (
            <li
              key={fila.entrega_id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <span className="font-medium">{fila.tipo_ayuda_nombre}</span>
                <span className="mx-2">·</span>
                <span>
                  {fila.direccion} ({fila.sector})
                </span>
                <span className="mx-2">·</span>
                <span className="text-zinc-500 dark:text-zinc-400">{fila.responsable_nombre ?? 'sin asignar'}</span>
                {fila.fecha_programada && (
                  <span className="mx-2 text-zinc-500 dark:text-zinc-400">· programada {fila.fecha_programada}</span>
                )}
                {fila.motivo_fallo && (
                  <div className="mt-1 text-zinc-500 dark:text-zinc-400">
                    Motivo de falla: {fila.motivo_fallo}
                    {fila.observacion_fallo && ` — ${fila.observacion_fallo}`}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
                  {ESTADO_ENTREGA_FILTRO_LABELS[fila.estado as EstadoEntregaFiltroReporte] ?? fila.estado}
                </span>
                <Link href={fila.ruta} className="text-sm underline">
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
