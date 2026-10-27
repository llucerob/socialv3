import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { obtenerGrupoFamiliar, obtenerHistorialGrupoFamiliar } from '@/lib/hogares/dal'
import { cambiarEstadoGrupoFamiliar } from '@/lib/hogares/actions'
import { listarIntegrantes } from '@/lib/personas/dal'
import { cambiarEstadoIntegrante } from '@/lib/personas/actions'
import { ESTADO_PERSONA_LABELS, type EstadoPersona } from '@/lib/personas/types'
import { listarSolicitudesDeHogar } from '@/lib/solicitudes/dal'
import { listarHitosDeHogar, ROLES_VER_HITOS, ROLES_REGISTRAR_HITOS } from '@/lib/hitos/dal'
import { TIPO_HITO_LABELS, TIPOS_HITO, type TipoHito } from '@/lib/hitos/types'
import { listarInformesSocialesDeHogar, ROLES_VER_INFORMES, ROLES_REGISTRAR_INFORMES } from '@/lib/informes-sociales/dal'
import { NIVEL_CONFIDENCIALIDAD_LABELS } from '@/lib/informes-sociales/types'
import { listarDocumentosDeHogar } from '@/lib/documentos/dal'
import { listarEntregasRealizadasDeHogar } from '@/lib/entregas/dal'
import { subirDocumentoHogar, actualizarRetencionDocumento, eliminarDocumento } from '@/lib/documentos/actions'
import { TIPOS_DOCUMENTO, type TipoDocumento } from '@/lib/documentos/types'
import { DocumentoUploadForm } from '../../documento-upload-form'
import { DocumentosSection } from '../../documentos-section'
import { superaUmbralElegibilidad, UMBRAL_ELEGIBILIDAD_RSH } from '@/lib/hogares/rsh'
import { RshBadge } from '../rsh-badge'
import { GeorreferenciacionBadge } from '../georreferenciacion-badge'
import { Card } from '@/components/ui/Card'
import { Button, ButtonLink } from '@/components/ui/Button'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { BadgeExcepcion, CardExcepcion } from '@/components/ui/ExcepcionRSH'
import { etiquetaReembolsoExcepcional } from '@/lib/reembolsos/tramos'
import { BannerSensible } from '@/components/ui/BannerSensible'
import { formatearFecha } from '@/lib/fechas'
import { tieneRol } from '@/lib/auth/roles'
import type { RolUsuario } from '@/lib/auth/types'

// US-20.02: "terreno no ve historial completo del hogar" — mismo criterio
// que hogares/page.tsx: bloquea solo a terreno_repartidor, que no tiene
// enlace de nav a este módulo; el resto de roles válidos mantiene el mismo
// acceso amplio que ya tenía.
const ROLES_VER_HOGAR: RolUsuario[] = [
  'administrador',
  'evaluador_social',
  'aprobador',
  'bodega_logistica',
  'finanzas',
  'auditor_consulta',
] as const
const ROLES_VEN_HISTORIAL: RolUsuario[] = ['administrador', 'evaluador_social']
const ESTADOS_PERSONA: EstadoPersona[] = [
  'activo',
  'ya_no_pertenece_hogar',
  'fallecido',
  'pendiente_validacion',
]

export default async function FichaGrupoFamiliarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tipo_documento?: string; tipo_hito?: string }>
}) {
  const { id } = await params
  const { tipo_documento: tipoDocumentoParam, tipo_hito: tipoHitoParam } = await searchParams
  const tipoFiltro = TIPOS_DOCUMENTO.includes(tipoDocumentoParam as TipoDocumento)
    ? (tipoDocumentoParam as TipoDocumento)
    : undefined
  const tipoHitoFiltro = TIPOS_HITO.includes(tipoHitoParam as TipoHito)
    ? (tipoHitoParam as TipoHito)
    : undefined
  const profile = await requireRole([...ROLES_VER_HOGAR])
  const hogar = await obtenerGrupoFamiliar(id)

  if (!hogar) {
    notFound()
  }

  const puedeEditar = tieneRol(profile, ['administrador', 'evaluador_social'])
  // US-18.04: solo administrador define estado de conservación o elimina un documento.
  const puedeGestionarRetencion = tieneRol(profile, ['administrador'])
  const puedeVerHistorial = tieneRol(profile, ROLES_VEN_HISTORIAL)
  const historial = puedeVerHistorial ? await obtenerHistorialGrupoFamiliar(id) : []
  const integrantes = await listarIntegrantes(id)
  const solicitudes = await listarSolicitudesDeHogar(id)
  // US-03.04: "ayudas entregadas" — mismo público que ve toda la ficha
  // (ROLES_VER_HOGAR ya autoriza esta página), así que no hace falta un
  // gate de rol adicional para esta consulta.
  const ayudasEntregadas = await listarEntregasRealizadasDeHogar(id)
  const anioActual = new Date().getFullYear()
  const ayudasEsteAnio = ayudasEntregadas.filter(
    (e) => e.fecha_hora_entrega && new Date(e.fecha_hora_entrega).getFullYear() === anioActual
  ).length

  // US-22.03: la sección de hitos es dato sensible — se filtra la
  // renderización según rol, igual que el historial de cambios críticos.
  // A diferencia de la ruta dedicada /hitos/nuevo (que gatea con
  // requireRoleHitos y audita el intento si corresponde), acá no se
  // audita: no mostrar una sección en una ficha que el usuario sí puede
  // ver por otros motivos no es un "intento de acceso", es la misma
  // omisión condicional que ya aplica a "Ayudas entregadas"/"Documentos".
  const puedeVerHitos = tieneRol(profile, ROLES_VER_HITOS)
  const puedeRegistrarHitos = tieneRol(profile, ROLES_REGISTRAR_HITOS)
  const todosLosHitos = puedeVerHitos ? await listarHitosDeHogar(id) : []
  // US-22.02: "se puede filtrar por tipo de hito" — mismo criterio que el
  // filtro de documentos (DocumentosSection): se trae el listado completo
  // (ya ordenado por fecha en listarHitosDeHogar) y se filtra acá, en vez de
  // agregar un parámetro a la consulta — la cantidad de hitos por hogar no
  // justifica un viaje de ida y vuelta adicional por cada cambio de filtro.
  const hitos = tipoHitoFiltro ? todosLosHitos.filter((hito) => hito.tipo === tipoHitoFiltro) : todosLosHitos

  // US-23.02: "acceso restringido según nivel de confidencialidad y rol" —
  // el filtrado por confidencialidad ya lo resuelve la RLS
  // (puede_ver_informe_social); ROLES_VER_INFORMES solo evita el viaje de
  // ida y vuelta para roles que de todos modos recibirían una lista vacía,
  // mismo criterio que puedeVerHitos.
  const puedeVerInformes = tieneRol(profile, ROLES_VER_INFORMES)
  const puedeRegistrarInformes = tieneRol(profile, ROLES_REGISTRAR_INFORMES)
  const informesSociales = puedeVerInformes ? await listarInformesSocialesDeHogar(id) : []

  const documentos = await listarDocumentosDeHogar(id)
  const subirDocumentoConId = subirDocumentoHogar.bind(null, id)

  const cambiarEstadoHogarConId = cambiarEstadoGrupoFamiliar.bind(null, hogar.id)

  // Prompt 2 (Paso 2): "si el hogar tiene excepción RSH" — el dato real más
  // directo disponible es el propio tramo_rsh del hogar contra el umbral de
  // CLAUDE.md (`superaUmbralElegibilidad`, misma regla que aplica `aprobarSolicitud`), no un flag guardado.
  const tieneExcepcionRsh = superaUmbralElegibilidad(hogar.tramo_rsh)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-xl bg-brand-800 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{hogar.direccion}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-brand-100">
            <span>{hogar.sector}</span>
            <EstadoBadge estado={hogar.estado} />
          </p>
        </div>
        <div className="flex items-center gap-2">
          {puedeEditar && (
            <form action={cambiarEstadoHogarConId}>
              <input type="hidden" name="estado" value={hogar.estado === 'activo' ? 'inactivo' : 'activo'} />
              <Button type="submit" variante="inverse">
                {hogar.estado === 'activo' ? 'Marcar como inactivo' : 'Reactivar hogar'}
              </Button>
            </form>
          )}
          {puedeEditar && (
            <ButtonLink href={`/hogares/${hogar.id}/editar`} variante="inverse">
              Editar
            </ButtonLink>
          )}
        </div>
      </div>

      {tieneExcepcionRsh && (
        <CardExcepcion>
          <div className="flex items-start gap-3">
            <BadgeExcepcion texto="Excepción RSH" />
            <p>
              Este hogar tiene tramo RSH {hogar.tramo_rsh}%, sobre el {UMBRAL_ELEGIBILIDAD_RSH}% —
              no puede aprobarse por flujo regular (CLAUDE.md). Cualquier ayuda requiere excepción
              explícita con informe social asociado.
            </p>
          </div>
        </CardExcepcion>
      )}

      {hogar.estado === 'inactivo' && (
        <p className="rounded-lg bg-warning-bg px-4 py-2 text-sm text-warning-fg">
          Este hogar está marcado como inactivo. No se pueden crear nuevas
          solicitudes hasta reactivarlo.
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-3xl font-semibold text-brand-800">{integrantes.length}</p>
          <p className="text-sm text-text-muted">Integrantes</p>
        </Card>
        <Card>
          <p className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-brand-600">
              {hogar.tramo_rsh !== null ? `${hogar.tramo_rsh}%` : '—'}
            </span>
            <RshBadge tramoRsh={hogar.tramo_rsh} fechaActualizacionRsh={hogar.fecha_actualizacion_rsh} />
          </p>
          <p className="text-sm text-text-muted">Tramo RSH</p>
        </Card>
        <Card>
          <p className="text-3xl font-semibold text-brand-800">{ayudasEsteAnio}</p>
          <p className="text-sm text-text-muted">Ayudas entregadas este año</p>
        </Card>
      </section>

      <Card header={<h2 className="font-medium text-text-primary">Datos del hogar</h2>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-text-muted">Teléfono</h3>
            <p className="text-text-primary">{hogar.telefono ?? '—'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-muted">Fecha actualización RSH</h3>
            <p className="text-text-primary">{formatearFecha(hogar.fecha_actualizacion_rsh)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-muted">Coordenadas</h3>
            <p className="flex items-center gap-2 text-text-primary">
              <span>
                {hogar.latitud !== null && hogar.longitud !== null
                  ? `${hogar.latitud}, ${hogar.longitud}`
                  : 'Sin registrar'}
              </span>
              <GeorreferenciacionBadge latitud={hogar.latitud} longitud={hogar.longitud} />
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-muted">Observaciones</h3>
            <p className="whitespace-pre-wrap text-text-primary">{hogar.observaciones ?? '—'}</p>
          </div>
        </div>
      </Card>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-text-primary">Integrantes</h2>
          {puedeEditar && (
            <ButtonLink href={`/hogares/${hogar.id}/integrantes/nuevo`} variante="secondary">
              Agregar integrante
            </ButtonLink>
          )}
        </div>

        {integrantes.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">Sin integrantes registrados todavía.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border rounded-xl border border-border bg-surface">
            {integrantes.map((persona) => {
              const cambiarEstadoPersonaConIds = cambiarEstadoIntegrante.bind(
                null,
                persona.id,
                hogar.id
              )

              return (
                <li key={persona.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium text-text-primary">
                      {persona.nombres} {persona.apellidos}
                    </p>
                    <p className="text-sm text-text-muted">
                      {persona.rut} · {persona.parentesco}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {puedeEditar ? (
                      <form action={cambiarEstadoPersonaConIds} className="flex items-center gap-2">
                        <select
                          name="estado"
                          defaultValue={persona.estado}
                          className="rounded-lg border border-border bg-transparent px-2 py-1 text-xs text-text-primary"
                        >
                          {ESTADOS_PERSONA.map((estado) => (
                            <option key={estado} value={estado}>
                              {ESTADO_PERSONA_LABELS[estado]}
                            </option>
                          ))}
                        </select>
                        <Button type="submit" variante="secondary" className="px-2 py-1 text-xs">
                          Aplicar
                        </Button>
                      </form>
                    ) : (
                      <EstadoBadge estado={persona.estado} />
                    )}
                    {puedeEditar && (
                      <Link
                        href={`/hogares/${hogar.id}/integrantes/${persona.id}/editar`}
                        className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-text-primary hover:bg-surface-alt"
                      >
                        Editar
                      </Link>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-text-primary">Solicitudes asociadas</h2>
          {puedeEditar && hogar.estado === 'activo' && (
            <ButtonLink href={`/hogares/${hogar.id}/solicitudes/nueva`} variante="secondary">
              Nueva solicitud
            </ButtonLink>
          )}
        </div>

        {solicitudes.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">Sin solicitudes registradas todavía.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border rounded-xl border border-border bg-surface">
            {solicitudes.map((solicitud) => (
              <li key={solicitud.id}>
                <Link
                  href={`/solicitudes/${solicitud.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-surface-alt"
                >
                  <span>
                    <span className="font-medium text-text-primary">{solicitud.tipo_ayuda_nombre}</span>
                    {solicitud.persona_nombre && (
                      <span className="ml-2 text-sm text-text-muted">{solicitud.persona_nombre}</span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {etiquetaReembolsoExcepcional(solicitud.tipo_ayuda_nombre) && (
                      <BadgeExcepcion texto={etiquetaReembolsoExcepcional(solicitud.tipo_ayuda_nombre)!} />
                    )}
                    <EstadoBadge estado={solicitud.estado} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {puedeVerHitos && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-text-primary">Hitos</h2>
            {puedeRegistrarHitos && (
              <ButtonLink href={`/hogares/${hogar.id}/hitos/nuevo`} variante="secondary">
                Registrar hito
              </ButtonLink>
            )}
          </div>

          <BannerSensible>
            Información sensible — visible solo para evaluador social, aprobador y administrador.
          </BannerSensible>

          {/* US-22.02: "se puede filtrar por tipo de hito" — mismo patrón
              sin JS que el filtro de documentos (?tipo_hito=...). Preserva
              tipo_documento si estaba activo, para no borrarlo al filtrar. */}
          <form className="flex items-center gap-2 text-sm">
            {tipoFiltro && <input type="hidden" name="tipo_documento" value={tipoFiltro} />}
            <label htmlFor="tipo_hito_filtro" className="text-text-muted">
              Filtrar por tipo
            </label>
            <select
              id="tipo_hito_filtro"
              name="tipo_hito"
              defaultValue={tipoHitoFiltro ?? ''}
              className="rounded-lg border border-border bg-transparent px-2 py-1 text-text-primary"
            >
              <option value="">Todos</option>
              {TIPOS_HITO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {TIPO_HITO_LABELS[tipo]}
                </option>
              ))}
            </select>
            <Button type="submit" variante="secondary" className="px-2 py-1">
              Filtrar
            </Button>
            {tipoHitoFiltro && (
              <a href={`/hogares/${hogar.id}`} className="text-brand-600 underline">
                Ver todos
              </a>
            )}
          </form>

          {hitos.length === 0 ? (
            <p className="text-sm text-text-muted">
              {tipoHitoFiltro ? 'Sin hitos de este tipo.' : 'Sin hitos registrados todavía.'}
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
              {hitos.map((hito) => (
                <li key={hito.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-primary">{TIPO_HITO_LABELS[hito.tipo]}</span>
                    <span className="text-xs text-text-muted">{formatearFecha(hito.fecha_hito)}</span>
                  </div>
                  <p className="text-sm text-text-muted">
                    {hito.categoria}
                    {hito.persona_nombre && ` · ${hito.persona_nombre}`}
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-wrap text-text-primary">{hito.comentario}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    Registrado por {hito.creado_por_nombre ?? 'usuario desconocido'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {puedeVerInformes && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-text-primary">Informes sociales</h2>
            {puedeRegistrarInformes && (
              <ButtonLink href={`/hogares/${hogar.id}/informes-sociales/nuevo`} variante="secondary">
                Registrar informe
              </ButtonLink>
            )}
          </div>

          <BannerSensible>
            Información sensible — el acceso a cada informe respeta además su nivel de
            confidencialidad.
          </BannerSensible>

          {informesSociales.length === 0 ? (
            <p className="text-sm text-text-muted">Sin informes sociales registrados todavía.</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
              {informesSociales.map((informe) => (
                <li key={informe.id} className="space-y-1 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-text-primary">{informe.motivo}</span>
                    <span className="shrink-0 text-xs text-text-muted">{formatearFecha(informe.fecha_informe)}</span>
                  </div>
                  <p className="text-sm text-text-muted">
                    {informe.persona_nombre && `${informe.persona_nombre} · `}
                    {informe.solicitud_id ? (
                      <Link href={`/solicitudes/${informe.solicitud_id}`} className="text-brand-600 underline">
                        {informe.solicitud_tipo_ayuda_nombre ?? 'Ver solicitud asociada'}
                      </Link>
                    ) : (
                      'Sin solicitud asociada'
                    )}
                    {' · '}
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                      {NIVEL_CONFIDENCIALIDAD_LABELS[informe.nivel_confidencialidad]}
                    </span>
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-wrap text-text-primary">{informe.recomendacion_profesional}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    Registrado por {informe.creado_por_nombre ?? 'usuario desconocido'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-medium text-text-primary">Documentos</h2>
        {puedeEditar && <DocumentoUploadForm action={subirDocumentoConId} />}
        <DocumentosSection
          documentos={documentos}
          baseHref={`/hogares/${hogar.id}`}
          tipoFiltro={tipoFiltro}
          puedeGestionarRetencion={puedeGestionarRetencion}
          accionRetencion={puedeGestionarRetencion ? actualizarRetencionDocumento : undefined}
          accionEliminar={puedeGestionarRetencion ? eliminarDocumento : undefined}
          preservarParams={tipoHitoFiltro ? { tipo_hito: tipoHitoFiltro } : undefined}
        />
      </section>

      <section>
        <h2 className="font-medium text-text-primary">Ayudas entregadas</h2>
        {ayudasEntregadas.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">Sin ayudas entregadas todavía.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border rounded-xl border border-border bg-surface">
            {ayudasEntregadas.map((entrega) => (
              <li key={entrega.entrega_id}>
                <Link
                  href={entrega.ruta}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-surface-alt"
                >
                  <span>
                    <span className="font-medium text-text-primary">{entrega.tipo_ayuda_nombre}</span>
                    {entrega.persona_nombre && (
                      <span className="ml-2 text-sm text-text-muted">{entrega.persona_nombre}</span>
                    )}
                    <span className="mt-1 block text-sm text-text-muted">
                      Recibió: {entrega.receptor_nombre ?? '—'}
                      {entrega.receptor_relacion && ` (${entrega.receptor_relacion})`}
                    </span>
                  </span>
                  <span className="text-xs text-text-muted">
                    {entrega.fecha_hora_entrega
                      ? new Date(entrega.fecha_hora_entrega).toLocaleString('es-CL')
                      : '—'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {puedeVerHistorial && (
        <section>
          <h2 className="font-medium text-text-primary">Historial de cambios críticos del hogar</h2>
          {historial.length === 0 ? (
            <p className="mt-2 text-sm text-text-muted">Sin cambios registrados todavía.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {historial.map((cambio) => (
                <li key={cambio.id} className="text-text-muted">
                  {new Date(cambio.creado_en).toLocaleString('es-CL')} · {cambio.campo}:{' '}
                  {cambio.valor_anterior ?? '—'} → {cambio.valor_nuevo ?? '—'}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
