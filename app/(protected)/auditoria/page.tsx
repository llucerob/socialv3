import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { listarEventosAuditoria, listarUsuariosParaAuditoria } from '@/lib/auditoria/dal'
import {
  ENTIDADES_AUDITORIA,
  ACCIONES_AUDITORIA,
  ENTIDAD_AUDITORIA_LABELS,
  ACCION_AUDITORIA_LABELS,
} from '@/lib/auditoria/types'
import { FiltrosBar, CampoFiltro } from '@/components/ui/FiltrosBar'
import { BadgeAccionAuditoria } from '@/components/ui/BadgeAccionAuditoria'

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
  const claseCampo = 'rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text-primary">Auditoría</h1>

      <FiltrosBar hrefLimpiar={hayFiltros ? '/auditoria' : undefined}>
        <CampoFiltro label="Desde" htmlFor="fecha_desde">
          <input type="date" id="fecha_desde" name="fecha_desde" defaultValue={fecha_desde} className={claseCampo} />
        </CampoFiltro>
        <CampoFiltro label="Hasta" htmlFor="fecha_hasta">
          <input type="date" id="fecha_hasta" name="fecha_hasta" defaultValue={fecha_hasta} className={claseCampo} />
        </CampoFiltro>
        <CampoFiltro label="Usuario" htmlFor="usuario_id">
          <select id="usuario_id" name="usuario_id" defaultValue={usuario_id} className={claseCampo}>
            <option value="">Todos</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
        </CampoFiltro>
        <CampoFiltro label="Entidad" htmlFor="entidad">
          <select id="entidad" name="entidad" defaultValue={entidad} className={claseCampo}>
            <option value="">Todas</option>
            {ENTIDADES_AUDITORIA.map((e) => (
              <option key={e} value={e}>
                {ENTIDAD_AUDITORIA_LABELS[e]}
              </option>
            ))}
          </select>
        </CampoFiltro>
        <CampoFiltro label="Acción" htmlFor="accion">
          <select id="accion" name="accion" defaultValue={accion} className={claseCampo}>
            <option value="">Todas</option>
            {ACCIONES_AUDITORIA.map((a) => (
              <option key={a} value={a}>
                {ACCION_AUDITORIA_LABELS[a]}
              </option>
            ))}
          </select>
        </CampoFiltro>
      </FiltrosBar>

      {eventos.length === 0 ? (
        <p className="text-sm text-text-muted">Sin eventos para este filtro.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {eventos.map((evento, index) => (
            <li key={index} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <span className="text-text-muted">{new Date(evento.fecha).toLocaleString('es-CL')}</span>
                <span className="mx-2">·</span>
                <span className="font-medium text-text-primary">{evento.usuario_nombre ?? 'Sistema'}</span>
                <span className="mx-2">·</span>
                <span className="text-text-primary">{evento.detalle}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-text-muted">
                  {ENTIDAD_AUDITORIA_LABELS[evento.entidad as keyof typeof ENTIDAD_AUDITORIA_LABELS] ?? evento.entidad}
                </span>
                <BadgeAccionAuditoria accion={evento.accion} />
                {evento.ruta && (
                  <Link href={evento.ruta} className="text-sm text-brand-600 hover:underline">
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
