import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { listarSolicitudesReembolso } from '@/lib/reembolsos/dal'
import { ESTADO_SOLICITUD_LABELS, type EstadoSolicitud } from '@/lib/solicitudes/types'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { FiltrosBar, CampoFiltro } from '@/components/ui/FiltrosBar'

// Mismo criterio de gating que el resto del nav (US-20.02: la página debe
// exigir el mismo rol que ya la expone en NAV_BY_ROL, no más ni menos) —
// "Reembolsos" solo aparece para administrador y finanzas.
const ROLES_VER_REEMBOLSOS = ['administrador', 'finanzas'] as const

export default async function ReembolsosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; tipo_ayuda_nombre?: string }>
}) {
  await requireRole([...ROLES_VER_REEMBOLSOS])
  const { estado, tipo_ayuda_nombre: tipoAyudaNombre } = await searchParams
  const solicitudes = await listarSolicitudesReembolso()

  const tipos = [...new Set(solicitudes.map((s) => s.tipo_ayuda_nombre))].sort()

  // Tanda C: filtros sobre los datos ya cargados por listarSolicitudesReembolso()
  // (misma consulta base que /solicitudes, sin filtro propio) — mismo patrón
  // sin consulta nueva ya usado en el listado de solicitudes (Tanda A).
  const solicitudesFiltradas = solicitudes.filter((s) => {
    if (estado && s.estado !== estado) return false
    if (tipoAyudaNombre && s.tipo_ayuda_nombre !== tipoAyudaNombre) return false
    return true
  })
  const hayFiltrosActivos = Boolean(estado || tipoAyudaNombre)
  const claseCampo = 'rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary'
  const estadosPresentes = [...new Set(solicitudes.map((s) => s.estado))] as EstadoSolicitud[]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text-primary">Reembolsos</h1>

      <FiltrosBar hrefLimpiar={hayFiltrosActivos ? '/reembolsos' : undefined}>
        <CampoFiltro label="Estado" htmlFor="estado">
          <select id="estado" name="estado" defaultValue={estado ?? ''} className={claseCampo}>
            <option value="">Todos</option>
            {estadosPresentes.map((valor) => (
              <option key={valor} value={valor}>
                {ESTADO_SOLICITUD_LABELS[valor]}
              </option>
            ))}
          </select>
        </CampoFiltro>
        <CampoFiltro label="Tipo de reembolso" htmlFor="tipo_ayuda_nombre">
          <select
            id="tipo_ayuda_nombre"
            name="tipo_ayuda_nombre"
            defaultValue={tipoAyudaNombre ?? ''}
            className={claseCampo}
          >
            <option value="">Todos</option>
            {tipos.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </CampoFiltro>
      </FiltrosBar>

      {solicitudesFiltradas.length === 0 ? (
        <p className="text-sm text-text-muted">
          {hayFiltrosActivos
            ? 'Sin reembolsos que coincidan con los filtros.'
            : 'Sin solicitudes de reembolso registradas todavía.'}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {solicitudesFiltradas.map((solicitud) => (
            <li key={solicitud.id}>
              <Link
                href={`/solicitudes/${solicitud.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface-alt"
              >
                <span className="min-w-0">
                  <span className="font-medium text-text-primary">{solicitud.tipo_ayuda_nombre}</span>
                  <span className="ml-2 text-sm text-text-muted">
                    {solicitud.grupo_familiar_direccion}
                    {solicitud.persona_nombre ? ` · ${solicitud.persona_nombre}` : ''}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  {solicitud.monto_solicitado !== null && (
                    <span className="text-sm text-text-muted">
                      ${solicitud.monto_solicitado.toLocaleString('es-CL')}
                    </span>
                  )}
                  <EstadoBadge estado={solicitud.estado} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
