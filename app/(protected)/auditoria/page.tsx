import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { listarEventosAuditoria, listarUsuariosParaAuditoria } from '@/lib/auditoria/dal'
import {
  ENTIDADES_AUDITORIA,
  ACCIONES_AUDITORIA,
  ENTIDAD_AUDITORIA_LABELS,
  ACCION_AUDITORIA_LABELS,
} from '@/lib/auditoria/types'

const ROLES_AUDITORIA = ['administrador', 'auditor_consulta'] as const

type SearchParams = {
  fecha_desde?: string
  fecha_hasta?: string
  usuario_id?: string
  entidad?: string
  accion?: string
}

// US-16.04: "consultar registros de auditoría... filtrar por fecha, por
// usuario, por entidad, por acción... solo roles autorizados pueden ver
// auditoría". El agregado en sí (qué tablas se unen, qué se excluye por ser
// dato sensible) vive en la función SQL listar_eventos_auditoria — ver el
// comentario de esa migración para el detalle.
export default async function AuditoriaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireRole([...ROLES_AUDITORIA])
  const { fecha_desde = '', fecha_hasta = '', usuario_id = '', entidad = '', accion = '' } = await searchParams

  const [eventos, usuarios] = await Promise.all([
    listarEventosAuditoria({
      fechaDesde: fecha_desde || undefined,
      fechaHasta: fecha_hasta || undefined,
      usuarioId: usuario_id || undefined,
      entidad: entidad || undefined,
      accion: accion || undefined,
    }),
    listarUsuariosParaAuditoria(),
  ])

  const hayFiltros = fecha_desde || fecha_hasta || usuario_id || entidad || accion

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Auditoría</h1>

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
          <label htmlFor="usuario_id" className="text-sm font-medium">
            Usuario
          </label>
          <select
            id="usuario_id"
            name="usuario_id"
            defaultValue={usuario_id}
            className="rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          >
            <option value="">Todos</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="entidad" className="text-sm font-medium">
            Entidad
          </label>
          <select
            id="entidad"
            name="entidad"
            defaultValue={entidad}
            className="rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          >
            <option value="">Todas</option>
            {ENTIDADES_AUDITORIA.map((e) => (
              <option key={e} value={e}>
                {ENTIDAD_AUDITORIA_LABELS[e]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="accion" className="text-sm font-medium">
            Acción
          </label>
          <select
            id="accion"
            name="accion"
            defaultValue={accion}
            className="rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          >
            <option value="">Todas</option>
            {ACCIONES_AUDITORIA.map((a) => (
              <option key={a} value={a}>
                {ACCION_AUDITORIA_LABELS[a]}
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
          <Link href="/auditoria" className="text-sm text-zinc-500 underline dark:text-zinc-400">
            Limpiar filtros
          </Link>
        )}
      </form>

      {eventos.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin eventos para este filtro.</p>
      ) : (
        <ul className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
          {eventos.map((evento, index) => (
            <li key={index} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <span className="text-zinc-500 dark:text-zinc-400">
                  {new Date(evento.fecha).toLocaleString('es-CL')}
                </span>
                <span className="mx-2">·</span>
                <span className="font-medium">{evento.usuario_nombre ?? 'Sistema'}</span>
                <span className="mx-2">·</span>
                <span>{evento.detalle}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-xs uppercase text-zinc-500 dark:text-zinc-400">
                <span>{ENTIDAD_AUDITORIA_LABELS[evento.entidad as keyof typeof ENTIDAD_AUDITORIA_LABELS] ?? evento.entidad}</span>
                <span>·</span>
                <span>{ACCION_AUDITORIA_LABELS[evento.accion as keyof typeof ACCION_AUDITORIA_LABELS] ?? evento.accion}</span>
                {evento.ruta && (
                  <Link href={evento.ruta} className="underline">
                    Ver
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
