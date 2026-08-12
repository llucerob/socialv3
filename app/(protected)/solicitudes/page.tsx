import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { listarSolicitudes } from '@/lib/solicitudes/dal'
import { listarTiposAyuda } from '@/lib/ayudas/dal'
import { ESTADO_SOLICITUD_LABELS, type EstadoSolicitud } from '@/lib/solicitudes/types'
import { UMBRAL_ELEGIBILIDAD_RSH } from '@/lib/hogares/rsh'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { BadgeExcepcion } from '@/components/ui/ExcepcionRSH'
import { FiltrosBar, CampoFiltro } from '@/components/ui/FiltrosBar'

// US-20.02: "terreno no ve historial completo del hogar" — el listado
// completo de solicitudes (motivo, tipo de ayuda, incluidos reembolsos
// médicos) no tenía ningún control de rol antes de esta historia; terreno no
// tiene enlace de nav aquí, pero una navegación directa por URL sí llegaba.
// El resto de roles válidos mantiene el mismo acceso que ya tenía.
const ROLES_VER_SOLICITUDES = [
  'administrador',
  'evaluador_social',
  'aprobador',
  'bodega_logistica',
  'finanzas',
  'auditor_consulta',
] as const

const ESTADOS_SOLICITUD = Object.keys(ESTADO_SOLICITUD_LABELS) as EstadoSolicitud[]

export default async function SolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; tipo_ayuda_id?: string; desde?: string; hasta?: string }>
}) {
  await requireRole([...ROLES_VER_SOLICITUDES])
  const { estado, tipo_ayuda_id, desde, hasta } = await searchParams
  const [solicitudes, tiposAyuda] = await Promise.all([listarSolicitudes(), listarTiposAyuda()])

  // Tanda A: filtros sobre los datos ya cargados por listarSolicitudes()
  // (sin paginación ni filtro propio hoy) — mismo patrón sin JS que
  // DocumentosSection (?tipo_documento=) y el filtro de hitos de la ficha
  // de hogar (?tipo_hito=), no una consulta nueva.
  const solicitudesFiltradas = solicitudes.filter((solicitud) => {
    if (estado && solicitud.estado !== estado) return false
    if (tipo_ayuda_id && solicitud.tipo_ayuda_id !== tipo_ayuda_id) return false
    if (desde && solicitud.fecha_solicitud < desde) return false
    if (hasta && solicitud.fecha_solicitud > hasta) return false
    return true
  })
  const hayFiltrosActivos = Boolean(estado || tipo_ayuda_id || desde || hasta)

  const claseCampo =
    'rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text-primary">Solicitudes</h1>

      <FiltrosBar hrefLimpiar={hayFiltrosActivos ? '/solicitudes' : undefined}>
        <CampoFiltro label="Estado" htmlFor="estado">
          <select id="estado" name="estado" defaultValue={estado ?? ''} className={claseCampo}>
            <option value="">Todos</option>
            {ESTADOS_SOLICITUD.map((valor) => (
              <option key={valor} value={valor}>
                {ESTADO_SOLICITUD_LABELS[valor]}
              </option>
            ))}
          </select>
        </CampoFiltro>
        <CampoFiltro label="Tipo de ayuda" htmlFor="tipo_ayuda_id">
          <select
            id="tipo_ayuda_id"
            name="tipo_ayuda_id"
            defaultValue={tipo_ayuda_id ?? ''}
            className={claseCampo}
          >
            <option value="">Todos</option>
            {tiposAyuda.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </CampoFiltro>
        <CampoFiltro label="Desde" htmlFor="desde">
          <input id="desde" name="desde" type="date" defaultValue={desde ?? ''} className={claseCampo} />
        </CampoFiltro>
        <CampoFiltro label="Hasta" htmlFor="hasta">
          <input id="hasta" name="hasta" type="date" defaultValue={hasta ?? ''} className={claseCampo} />
        </CampoFiltro>
      </FiltrosBar>

      {solicitudesFiltradas.length === 0 ? (
        <p className="text-sm text-text-muted">
          {hayFiltrosActivos
            ? 'Sin solicitudes que coincidan con los filtros.'
            : 'Sin solicitudes registradas. Se crean desde la ficha de un grupo familiar.'}
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
                    {solicitud.grupo_familiar_sector ? ` · ${solicitud.grupo_familiar_sector}` : ''}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                    <span>{solicitud.fecha_solicitud}</span>
                    {solicitud.grupo_familiar_tramo_rsh !== null && (
                      <span className="font-medium text-brand-600">
                        RSH {solicitud.grupo_familiar_tramo_rsh}%
                      </span>
                    )}
                    {solicitud.grupo_familiar_tramo_rsh !== null &&
                      solicitud.grupo_familiar_tramo_rsh > UMBRAL_ELEGIBILIDAD_RSH && (
                        <BadgeExcepcion texto="Excepción RSH" />
                      )}
                  </span>
                </span>
                <EstadoBadge estado={solicitud.estado} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
