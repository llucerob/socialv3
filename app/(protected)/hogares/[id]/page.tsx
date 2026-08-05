import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { obtenerGrupoFamiliar, obtenerHistorialGrupoFamiliar } from '@/lib/hogares/dal'
import { cambiarEstadoGrupoFamiliar } from '@/lib/hogares/actions'
import { listarIntegrantes } from '@/lib/personas/dal'
import { cambiarEstadoIntegrante } from '@/lib/personas/actions'
import { ESTADO_PERSONA_LABELS, type EstadoPersona } from '@/lib/personas/types'
import { listarSolicitudesDeHogar } from '@/lib/solicitudes/dal'
import { ESTADO_SOLICITUD_LABELS } from '@/lib/solicitudes/types'
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
import { RshBadge } from '../rsh-badge'
import { GeorreferenciacionBadge } from '../georreferenciacion-badge'

// US-20.02: "terreno no ve historial completo del hogar" — mismo criterio
// que hogares/page.tsx: bloquea solo a terreno_repartidor, que no tiene
// enlace de nav a este módulo; el resto de roles válidos mantiene el mismo
// acceso amplio que ya tenía.
const ROLES_VER_HOGAR = [
  'administrador',
  'evaluador_social',
  'aprobador',
  'bodega_logistica',
  'finanzas',
  'auditor_consulta',
] as const
const ROLES_VEN_HISTORIAL = ['administrador', 'evaluador_social']
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

  const puedeEditar = profile.rol === 'administrador' || profile.rol === 'evaluador_social'
  // US-18.04: solo administrador define estado de conservación o elimina un documento.
  const puedeGestionarRetencion = profile.rol === 'administrador'
  const puedeVerHistorial = ROLES_VEN_HISTORIAL.includes(profile.rol)
  const historial = puedeVerHistorial ? await obtenerHistorialGrupoFamiliar(id) : []
  const integrantes = await listarIntegrantes(id)
  const solicitudes = await listarSolicitudesDeHogar(id)
  // US-03.04: "ayudas entregadas" — mismo público que ve toda la ficha
  // (ROLES_VER_HOGAR ya autoriza esta página), así que no hace falta un
  // gate de rol adicional para esta consulta.
  const ayudasEntregadas = await listarEntregasRealizadasDeHogar(id)

  // US-22.03: la sección de hitos es dato sensible — se filtra la
  // renderización según rol, igual que el historial de cambios críticos.
  // A diferencia de la ruta dedicada /hitos/nuevo (que gatea con
  // requireRoleHitos y audita el intento si corresponde), acá no se
  // audita: no mostrar una sección en una ficha que el usuario sí puede
  // ver por otros motivos no es un "intento de acceso", es la misma
  // omisión condicional que ya aplica a "Ayudas entregadas"/"Documentos".
  const puedeVerHitos = ROLES_VER_HITOS.includes(profile.rol)
  const puedeRegistrarHitos = ROLES_REGISTRAR_HITOS.includes(profile.rol)
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
  const puedeVerInformes = ROLES_VER_INFORMES.includes(profile.rol)
  const puedeRegistrarInformes = ROLES_REGISTRAR_INFORMES.includes(profile.rol)
  const informesSociales = puedeVerInformes ? await listarInformesSocialesDeHogar(id) : []

  const documentos = await listarDocumentosDeHogar(id)
  const subirDocumentoConId = subirDocumentoHogar.bind(null, id)

  const cambiarEstadoHogarConId = cambiarEstadoGrupoFamiliar.bind(null, hogar.id)

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{hogar.direccion}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {hogar.sector} · estado {hogar.estado}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {puedeEditar && (
            <form action={cambiarEstadoHogarConId}>
              <input type="hidden" name="estado" value={hogar.estado === 'activo' ? 'inactivo' : 'activo'} />
              <button
                type="submit"
                className="rounded border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/20"
              >
                {hogar.estado === 'activo' ? 'Marcar como inactivo' : 'Reactivar hogar'}
              </button>
            </form>
          )}
          {puedeEditar && (
            <Link
              href={`/hogares/${hogar.id}/editar`}
              className="rounded border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/20"
            >
              Editar
            </Link>
          )}
        </div>
      </div>

      {hogar.estado === 'inactivo' && (
        <p className="rounded border border-amber-600/30 bg-amber-600/10 px-4 py-2 text-sm text-amber-700 dark:text-amber-500">
          Este hogar está marcado como inactivo. No se pueden crear nuevas
          solicitudes hasta reactivarlo.
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Teléfono</h2>
          <p>{hogar.telefono ?? '—'}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Tramo RSH</h2>
          <p className="flex items-center gap-2">
            <span>{hogar.tramo_rsh !== null ? `${hogar.tramo_rsh}%` : 'Sin registrar'}</span>
            <RshBadge
              tramoRsh={hogar.tramo_rsh}
              fechaActualizacionRsh={hogar.fecha_actualizacion_rsh}
            />
          </p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Fecha actualización RSH
          </h2>
          <p>{hogar.fecha_actualizacion_rsh ?? '—'}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Coordenadas</h2>
          <p className="flex items-center gap-2">
            <span>
              {hogar.latitud !== null && hogar.longitud !== null
                ? `${hogar.latitud}, ${hogar.longitud}`
                : 'Sin registrar'}
            </span>
            <GeorreferenciacionBadge latitud={hogar.latitud} longitud={hogar.longitud} />
          </p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Observaciones</h2>
          <p className="whitespace-pre-wrap">{hogar.observaciones ?? '—'}</p>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Integrantes</h2>
          {puedeEditar && (
            <Link
              href={`/hogares/${hogar.id}/integrantes/nuevo`}
              className="rounded border border-black/10 px-3 py-1.5 text-sm font-medium dark:border-white/20"
            >
              Agregar integrante
            </Link>
          )}
        </div>

        {integrantes.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Sin integrantes registrados todavía.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
            {integrantes.map((persona) => {
              const cambiarEstadoPersonaConIds = cambiarEstadoIntegrante.bind(
                null,
                persona.id,
                hogar.id
              )

              return (
                <li key={persona.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium">
                      {persona.nombres} {persona.apellidos}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {persona.rut} · {persona.parentesco}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {puedeEditar ? (
                      <form action={cambiarEstadoPersonaConIds} className="flex items-center gap-2">
                        <select
                          name="estado"
                          defaultValue={persona.estado}
                          className="rounded border border-black/10 bg-transparent px-2 py-1 text-xs dark:border-white/20"
                        >
                          {ESTADOS_PERSONA.map((estado) => (
                            <option key={estado} value={estado}>
                              {ESTADO_PERSONA_LABELS[estado]}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded border border-black/10 px-2 py-1 text-xs font-medium dark:border-white/20"
                        >
                          Aplicar
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
                        {ESTADO_PERSONA_LABELS[persona.estado]}
                      </span>
                    )}
                    {puedeEditar && (
                      <Link
                        href={`/hogares/${hogar.id}/integrantes/${persona.id}/editar`}
                        className="rounded border border-black/10 px-2 py-1 text-xs font-medium dark:border-white/20"
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
          <h2 className="font-medium">Solicitudes asociadas</h2>
          {puedeEditar && hogar.estado === 'activo' && (
            <Link
              href={`/hogares/${hogar.id}/solicitudes/nueva`}
              className="rounded border border-black/10 px-3 py-1.5 text-sm font-medium dark:border-white/20"
            >
              Nueva solicitud
            </Link>
          )}
        </div>

        {solicitudes.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Sin solicitudes registradas todavía.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
            {solicitudes.map((solicitud) => (
              <li key={solicitud.id}>
                <Link
                  href={`/solicitudes/${solicitud.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <span>
                    <span className="font-medium">{solicitud.tipo_ayuda_nombre}</span>
                    {solicitud.persona_nombre && (
                      <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                        {solicitud.persona_nombre}
                      </span>
                    )}
                  </span>
                  <span className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
                    {ESTADO_SOLICITUD_LABELS[solicitud.estado]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {puedeVerHitos && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Hitos</h2>
            {puedeRegistrarHitos && (
              <Link
                href={`/hogares/${hogar.id}/hitos/nuevo`}
                className="rounded border border-black/10 px-3 py-1.5 text-sm font-medium dark:border-white/20"
              >
                Registrar hito
              </Link>
            )}
          </div>

          {/* US-22.02: "se puede filtrar por tipo de hito" — mismo patrón
              sin JS que el filtro de documentos (?tipo_hito=...). Preserva
              tipo_documento si estaba activo, para no borrarlo al filtrar. */}
          <form className="mt-2 flex items-center gap-2 text-sm">
            {tipoFiltro && <input type="hidden" name="tipo_documento" value={tipoFiltro} />}
            <label htmlFor="tipo_hito_filtro" className="text-zinc-500 dark:text-zinc-400">
              Filtrar por tipo
            </label>
            <select
              id="tipo_hito_filtro"
              name="tipo_hito"
              defaultValue={tipoHitoFiltro ?? ''}
              className="rounded border border-black/10 bg-transparent px-2 py-1 dark:border-white/20"
            >
              <option value="">Todos</option>
              {TIPOS_HITO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {TIPO_HITO_LABELS[tipo]}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded border border-black/10 px-2 py-1 dark:border-white/20">
              Filtrar
            </button>
            {tipoHitoFiltro && (
              <a href={`/hogares/${hogar.id}`} className="text-zinc-500 underline dark:text-zinc-400">
                Ver todos
              </a>
            )}
          </form>

          {hitos.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {tipoHitoFiltro ? 'Sin hitos de este tipo.' : 'Sin hitos registrados todavía.'}
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
              {hitos.map((hito) => (
                <li key={hito.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{TIPO_HITO_LABELS[hito.tipo]}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {hito.fecha_hito}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {hito.categoria}
                    {hito.persona_nombre && ` · ${hito.persona_nombre}`}
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{hito.comentario}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Registrado por {hito.creado_por_nombre ?? 'usuario desconocido'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {puedeVerInformes && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Informes sociales</h2>
            {puedeRegistrarInformes && (
              <Link
                href={`/hogares/${hogar.id}/informes-sociales/nuevo`}
                className="rounded border border-black/10 px-3 py-1.5 text-sm font-medium dark:border-white/20"
              >
                Registrar informe
              </Link>
            )}
          </div>

          {informesSociales.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Sin informes sociales registrados todavía.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
              {informesSociales.map((informe) => (
                <li key={informe.id} className="space-y-1 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{informe.motivo}</span>
                    <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{informe.fecha_informe}</span>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {informe.persona_nombre && `${informe.persona_nombre} · `}
                    {informe.solicitud_id ? (
                      <Link href={`/solicitudes/${informe.solicitud_id}`} className="underline">
                        {informe.solicitud_tipo_ayuda_nombre ?? 'Ver solicitud asociada'}
                      </Link>
                    ) : (
                      'Sin solicitud asociada'
                    )}
                    {' · '}
                    <span className="rounded-full border border-black/10 px-2 py-0.5 text-xs dark:border-white/20">
                      {NIVEL_CONFIDENCIALIDAD_LABELS[informe.nivel_confidencialidad]}
                    </span>
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{informe.recomendacion_profesional}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Registrado por {informe.creado_por_nombre ?? 'usuario desconocido'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-medium">Documentos</h2>
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
        <h2 className="font-medium">Ayudas entregadas</h2>
        {ayudasEntregadas.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Sin ayudas entregadas todavía.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
            {ayudasEntregadas.map((entrega) => (
              <li key={entrega.entrega_id}>
                <Link
                  href={entrega.ruta}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <span>
                    <span className="font-medium">{entrega.tipo_ayuda_nombre}</span>
                    {entrega.persona_nombre && (
                      <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                        {entrega.persona_nombre}
                      </span>
                    )}
                    <span className="mt-1 block text-sm text-zinc-500 dark:text-zinc-400">
                      Recibió: {entrega.receptor_nombre ?? '—'}
                      {entrega.receptor_relacion && ` (${entrega.receptor_relacion})`}
                    </span>
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
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
          <h2 className="font-medium">Historial de cambios críticos del hogar</h2>
          {historial.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Sin cambios registrados todavía.
            </p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {historial.map((cambio) => (
                <li key={cambio.id} className="text-zinc-600 dark:text-zinc-400">
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
