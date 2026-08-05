import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import {
  obtenerSolicitud,
  obtenerHistorialSolicitud,
  listarSolicitudesDeHogar,
  detectarPosiblesDuplicados,
} from '@/lib/solicitudes/dal'
import { anularSolicitud, volverAEvaluacion } from '@/lib/solicitudes/actions'
import { ESTADO_SOLICITUD_LABELS, type EstadoSolicitud } from '@/lib/solicitudes/types'
import { listarEvaluacionesDeSolicitud } from '@/lib/evaluaciones/dal'
import { RECOMENDACION_LABELS } from '@/lib/evaluaciones/types'
import { obtenerTipoAyuda } from '@/lib/ayudas/dal'
import { obtenerGrupoFamiliar } from '@/lib/hogares/dal'
import { superaUmbralElegibilidad, UMBRAL_ELEGIBILIDAD_RSH } from '@/lib/hogares/rsh'
import { obtenerDecisionDeSolicitud } from '@/lib/decisiones/dal'
import { DECISION_LABELS } from '@/lib/decisiones/types'
import {
  listarInformesSocialesDeSolicitud,
  ROLES_VER_INFORMES,
  ROLES_REGISTRAR_INFORMES,
} from '@/lib/informes-sociales/dal'
import { listarDocumentosDeSolicitud } from '@/lib/documentos/dal'
import {
  subirDocumentoSolicitud,
  validarDocumento,
  actualizarRetencionDocumento,
  eliminarDocumento,
} from '@/lib/documentos/actions'
import type { TipoDocumento } from '@/lib/documentos/types'
import { TIPOS_DOCUMENTO } from '@/lib/documentos/types'
import {
  calcularTopeReembolsoGeneral,
  calcularAcumuladoDialisisMensual,
  calcularRemanenteReembolsoAnual,
  obtenerPagoDeSolicitud,
} from '@/lib/reembolsos/dal'
import { registrarPagoReembolso } from '@/lib/reembolsos/actions'
import {
  NOMBRE_TIPO_AYUDA_REEMBOLSO_GENERAL,
  NOMBRE_TIPO_AYUDA_REEMBOLSO_DIALISIS,
  NOMBRES_TIPO_AYUDA_REEMBOLSO_EXCEPCIONAL,
} from '@/lib/reembolsos/tramos'
import { RegistrarPagoForm } from '../registrar-pago-form'
import { ExcepcionDialisisForm } from '../excepcion-dialisis-form'
import { ExcepcionRshForm } from '../excepcion-rsh-form'
import { listarProductos, listarMovimientosDeSolicitud } from '@/lib/inventario/dal'
import { registrarSalidaStock } from '@/lib/inventario/actions'
import {
  obtenerEntregaDeSolicitud,
  obtenerEntregaLecturaDeSolicitud,
  listarFuncionariosTerreno,
  obtenerHistorialEntrega,
} from '@/lib/entregas/dal'
import { crearEntrega, asignarResponsable, reprogramarEntrega } from '@/lib/entregas/actions'
import { ESTADO_ENTREGA_LABELS } from '@/lib/entregas/types'
import { DocumentoUploadForm } from '../../documento-upload-form'
import { DocumentosSection } from '../../documentos-section'
import { EnviarEvaluacionButton } from '../enviar-evaluacion-button'
import { ObservarForm } from '../observar-form'
import { EvaluacionForm } from '../evaluacion-form'
import { AprobarForm } from '../aprobar-form'
import { RechazarForm } from '../rechazar-form'
import { SalidaStockForm } from '../salida-stock-form'
import { EntregaAsignacionForm } from '../entrega-asignacion-form'

// EPIC 07: gestión general de la solicitud (crear, editar, enviar, anular).
const ROLES_GESTION_SOLICITUD = ['administrador', 'evaluador_social']
// US-08.01: solo evaluador social/administrador registran evaluaciones.
const ROLES_EVALUAR = ['administrador', 'evaluador_social']
// US-08.03: "Como evaluador o aprobador" — el único punto de EPIC 08 donde
// el aprobador también actúa.
const ROLES_OBSERVAR = ['administrador', 'evaluador_social', 'aprobador']
// US-09.01/09.02: "solo rol aprobador puede aprobar/rechazar" — evaluador_social
// NO puede decidir (a diferencia de EPIC 07/08).
const ROLES_APROBACION = ['administrador', 'aprobador']
// Contenido sensible (evaluaciones, historial de ayudas del hogar, auditoría)
// restringido según CLAUDE.md: evaluador social/aprobador/administrador.
const ROLES_VER_SENSIBLE = ['administrador', 'evaluador_social', 'aprobador']
// US-11.03: "como bodega" registra la salida de stock una vez aprobada la
// solicitud — mismo criterio de EPIC 11 (lib/inventario/actions.ts).
const ROLES_STOCK = ['administrador', 'bodega_logistica']
// US-12.01/US-12.02: "como bodega o logística" crea y asigna entregas.
const ROLES_LOGISTICA = ['administrador', 'bodega_logistica']
// US-14.04: "solo finanzas o administrador puede registrar pago".
const ROLES_FINANZAS = ['administrador', 'finanzas']
// US-14.02: "como finanzas o evaluador autorizado" valida documentos de reembolso.
const ROLES_VALIDAR_DOCUMENTOS = ['administrador', 'evaluador_social', 'finanzas']
// US-15.05: "solo rol autorizado puede aprobar excepción" al tope de diálisis.
const ROLES_EXCEPCION_DIALISIS = ['administrador']
// US-05.05: "solo roles autorizados (aprobador/administrador) pueden
// registrar la excepción" — a diferencia de la excepción de diálisis.
const ROLES_EXCEPCION_RSH = ['administrador', 'aprobador']
// US-20.02: "terreno no ve historial completo del hogar" — terreno_repartidor
// no aparece en ninguna de las listas de arriba (no gestiona, evalúa,
// aprueba, ni maneja stock/pago de una solicitud) y no tiene enlace de nav a
// este módulo; antes de esta historia, una navegación directa por URL sí
// llegaba. El resto de roles válidos mantiene el mismo acceso que ya tenía.
const ROLES_VER_SOLICITUD = [
  'administrador',
  'evaluador_social',
  'aprobador',
  'bodega_logistica',
  'finanzas',
  'auditor_consulta',
] as const
const ESTADOS_CON_PAGO_PENDIENTE: EstadoSolicitud[] = ['aprobada', 'aprobada_excepcion']

const ESTADOS_EDITABLES: EstadoSolicitud[] = ['borrador', 'ingresada']
const ESTADOS_ANULABLES: EstadoSolicitud[] = ['borrador', 'ingresada', 'en_evaluacion']
// 'pendiente_stock' también es válido: es a donde cae esta misma acción
// cuando falla por falta de stock, y bodega debe poder reintentar desde ahí.
const ESTADOS_CON_SALIDA_STOCK: EstadoSolicitud[] = ['aprobada', 'aprobada_excepcion', 'pendiente_stock']
const ESTADOS_CON_ENTREGA: EstadoSolicitud[] = ['aprobada', 'aprobada_excepcion']

export default async function DetalleSolicitudPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tipo_documento?: string }>
}) {
  const { id } = await params
  const { tipo_documento: tipoDocumentoParam } = await searchParams
  const tipoFiltro = TIPOS_DOCUMENTO.includes(tipoDocumentoParam as TipoDocumento)
    ? (tipoDocumentoParam as TipoDocumento)
    : undefined
  const profile = await requireRole([...ROLES_VER_SOLICITUD])
  const solicitud = await obtenerSolicitud(id)

  if (!solicitud) {
    notFound()
  }

  const puedeGestionar = ROLES_GESTION_SOLICITUD.includes(profile.rol)
  const puedeEvaluar = ROLES_EVALUAR.includes(profile.rol)
  const puedeObservar = ROLES_OBSERVAR.includes(profile.rol)
  const puedeAprobar = ROLES_APROBACION.includes(profile.rol)
  const puedeVerSensible = ROLES_VER_SENSIBLE.includes(profile.rol)
  const puedeVerStock = ROLES_STOCK.includes(profile.rol)
  const puedeRegistrarSalidaStock = puedeVerStock && ESTADOS_CON_SALIDA_STOCK.includes(solicitud.estado)
  const puedeGestionarEntregas = ROLES_LOGISTICA.includes(profile.rol)
  const puedeRegistrarPago = ROLES_FINANZAS.includes(profile.rol)
  // US-18.04: solo administrador define estado de conservación o elimina un documento.
  const puedeGestionarRetencion = profile.rol === 'administrador'

  const historial = puedeVerSensible ? await obtenerHistorialSolicitud(id) : []
  const evaluaciones = puedeVerSensible ? await listarEvaluacionesDeSolicitud(id) : []
  const decision = puedeVerSensible ? await obtenerDecisionDeSolicitud(id) : null
  const tipoAyuda = await obtenerTipoAyuda(solicitud.tipo_ayuda_id)
  const esReembolso = tipoAyuda?.tipo === 'reembolso'
  const puedeValidarDocumentos = ROLES_VALIDAR_DOCUMENTOS.includes(profile.rol) && esReembolso
  const validarDocumentoConId = puedeValidarDocumentos ? validarDocumento : undefined

  // US-14.05: tope calculado, solo relevante mientras hay una decisión
  // pendiente sobre un reembolso médico general.
  const topeReembolsoGeneral =
    puedeAprobar &&
    solicitud.estado === 'en_evaluacion' &&
    tipoAyuda?.nombre === NOMBRE_TIPO_AYUDA_REEMBOLSO_GENERAL
      ? await calcularTopeReembolsoGeneral(
          solicitud.grupo_familiar_id,
          Number(solicitud.fecha_solicitud.slice(0, 4))
        )
      : undefined

  // US-15.03/15.04: acumulado mensual de diálisis, por persona beneficiaria
  // (no por hogar). US-15.05: la excepción admin-only está disponible en el
  // mismo punto que la decisión normal, siempre que sea una solicitud de
  // diálisis en evaluación.
  const esDialisis = tipoAyuda?.nombre === NOMBRE_TIPO_AYUDA_REEMBOLSO_DIALISIS
  const topeDialisis =
    puedeAprobar && solicitud.estado === 'en_evaluacion' && esDialisis && solicitud.persona_id
      ? await calcularAcumuladoDialisisMensual(
          solicitud.persona_id,
          Number(solicitud.fecha_solicitud.slice(0, 4)),
          Number(solicitud.fecha_solicitud.slice(5, 7))
        )
      : undefined
  const puedeAprobarExcepcionDialisis =
    ROLES_EXCEPCION_DIALISIS.includes(profile.rol) && esDialisis && solicitud.estado === 'en_evaluacion'

  // 🆕 EPIC 25 (US-25.02/25.03/25.05): remanente anual compartido, solo
  // relevante mientras hay una decisión pendiente sobre un reembolso
  // excepcional (cirugía o fallecimiento) — misma fuente única que el tope
  // de reembolso general (US-14.05/25.02).
  const esReembolsoExcepcional = Boolean(
    tipoAyuda && (NOMBRES_TIPO_AYUDA_REEMBOLSO_EXCEPCIONAL as readonly string[]).includes(tipoAyuda.nombre)
  )
  const remanenteExcepcional =
    puedeAprobar && solicitud.estado === 'en_evaluacion' && esReembolsoExcepcional
      ? {
          remanenteAnual: await calcularRemanenteReembolsoAnual(
            solicitud.grupo_familiar_id,
            Number(solicitud.fecha_solicitud.slice(0, 4))
          ),
        }
      : undefined

  // US-05.04/US-05.05: "el sistema bloquea la aprobación regular y exige que
  // la solicitud se marque como excepción" cuando el hogar supera el 40%
  // RSH. Se muestra a quien puede ver contenido sensible (evaluador_social
  // también, para saber que debe preparar un informe social) — no solo a
  // quien puede aprobar.
  const hogar = puedeVerSensible ? await obtenerGrupoFamiliar(solicitud.grupo_familiar_id) : null
  const rshSuperaUmbral = superaUmbralElegibilidad(hogar?.tramo_rsh ?? null)
  const puedeVerInformes = ROLES_VER_INFORMES.includes(profile.rol)
  const puedeRegistrarInformes = ROLES_REGISTRAR_INFORMES.includes(profile.rol)
  // US-23.02/US-23.03: "la referencia es visible desde ambos lados" — este
  // es el lado caso → informe.
  const informesSociales = puedeVerInformes ? await listarInformesSocialesDeSolicitud(id) : []
  const puedeAprobarExcepcionRsh =
    ROLES_EXCEPCION_RSH.includes(profile.rol) && rshSuperaUmbral && solicitud.estado === 'en_evaluacion'

  // US-14.04: "registrar pago de reembolso" — solo aplica a ayudas de tipo
  // reembolso, una vez aprobadas. Se lee el monto aprobado directamente
  // (no vía obtenerDecisionDeSolicitud/ROLES_VER_SENSIBLE, que finanzas no
  // integra) para no exponerle a finanzas el resto del bloque "Decisión"
  // (comentario del aprobador, etc.) — solo el número que necesita.
  const pagoReembolso = puedeRegistrarPago && esReembolso ? await obtenerPagoDeSolicitud(id) : null
  const decisionParaPago =
    puedeRegistrarPago && esReembolso && !pagoReembolso ? await obtenerDecisionDeSolicitud(id) : null
  const puedeRegistrarPagoAhora =
    puedeRegistrarPago &&
    esReembolso &&
    !pagoReembolso &&
    ESTADOS_CON_PAGO_PENDIENTE.includes(solicitud.estado)
  const registrarPagoConId = registrarPagoReembolso.bind(null, id)

  // US-08.02: historial de ayudas del hogar + advertencia de posibles duplicados.
  const solicitudesDelHogar = puedeVerSensible
    ? await listarSolicitudesDeHogar(solicitud.grupo_familiar_id)
    : []
  const ayudasPrevias = solicitudesDelHogar.filter((s) => s.id !== solicitud.id)
  const posiblesDuplicados = puedeVerSensible
    ? detectarPosiblesDuplicados(solicitudesDelHogar, solicitud.id, solicitud.tipo_ayuda_id)
    : []

  const documentos = await listarDocumentosDeSolicitud(id)
  const subirDocumentoConId = subirDocumentoSolicitud.bind(null, id)

  const productos = puedeRegistrarSalidaStock ? await listarProductos() : []
  const movimientosStock = puedeVerStock ? await listarMovimientosDeSolicitud(id) : []
  const registrarSalidaStockConId = registrarSalidaStock.bind(null, id)

  // US-12.01: solo tiene sentido ofrecer "crear entrega" para ayudas que de
  // verdad se entregan físicamente (tipos_ayuda.requiere_entrega, US-06.02) —
  // p. ej. un reembolso nunca genera una entrega.
  const entrega = puedeGestionarEntregas ? await obtenerEntregaDeSolicitud(id) : null
  const puedeCrearEntrega =
    puedeGestionarEntregas &&
    !entrega &&
    Boolean(tipoAyuda?.requiere_entrega) &&
    ESTADOS_CON_ENTREGA.includes(solicitud.estado)
  const funcionariosTerreno =
    puedeGestionarEntregas && (puedeCrearEntrega || entrega?.estado === 'pendiente' || entrega?.estado === 'fallida')
      ? await listarFuncionariosTerreno()
      : []
  const historialEntrega =
    puedeGestionarEntregas && entrega ? await obtenerHistorialEntrega(entrega.id) : []
  const crearEntregaConId = crearEntrega.bind(null, id)

  // EPIC 12: vista de solo lectura para el resto de roles que pueden ver
  // esta solicitud pero no gestionan entregas (evaluador_social, aprobador,
  // finanzas, auditor_consulta) — antes no veían nada de esta sección.
  const entregaLectura =
    !puedeGestionarEntregas && (tipoAyuda?.requiere_entrega ?? false)
      ? await obtenerEntregaLecturaDeSolicitud(id)
      : null
  const asignarResponsableConId = entrega ? asignarResponsable.bind(null, entrega.id) : undefined
  const reprogramarEntregaConId = entrega ? reprogramarEntrega.bind(null, entrega.id) : undefined

  const anularConId = anularSolicitud.bind(null, id)
  const volverAEvaluacionConId = volverAEvaluacion.bind(null, id)

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{solicitud.tipo_ayuda_nombre}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <Link href={`/hogares/${solicitud.grupo_familiar_id}`} className="underline">
              {solicitud.grupo_familiar_direccion}
            </Link>
            {solicitud.persona_nombre ? ` · ${solicitud.persona_nombre}` : ''} · estado{' '}
            {ESTADO_SOLICITUD_LABELS[solicitud.estado]}
          </p>
        </div>
        {puedeGestionar && ESTADOS_EDITABLES.includes(solicitud.estado) && (
          <Link
            href={`/solicitudes/${solicitud.id}/editar`}
            className="rounded border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/20"
          >
            Editar
          </Link>
        )}
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Fecha</h2>
          <p>{solicitud.fecha_solicitud}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Motivo</h2>
          <p className="whitespace-pre-wrap">{solicitud.motivo}</p>
        </div>
        {solicitud.monto_solicitado !== null && (
          <div>
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Monto solicitado
            </h2>
            <p>${solicitud.monto_solicitado.toLocaleString('es-CL')}</p>
          </div>
        )}
        <div className="sm:col-span-2">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Observaciones</h2>
          <p className="whitespace-pre-wrap">{solicitud.observaciones ?? '—'}</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Documentos</h2>
        {puedeGestionar && <DocumentoUploadForm action={subirDocumentoConId} />}
        <DocumentosSection
          documentos={documentos}
          baseHref={`/solicitudes/${id}`}
          tipoFiltro={tipoFiltro}
          puedeValidar={puedeValidarDocumentos}
          accionValidar={validarDocumentoConId}
          puedeGestionarRetencion={puedeGestionarRetencion}
          accionRetencion={puedeGestionarRetencion ? actualizarRetencionDocumento : undefined}
          accionEliminar={puedeGestionarRetencion ? eliminarDocumento : undefined}
        />
      </section>

      {puedeRegistrarPago && esReembolso && (
        <section className="space-y-3">
          <h2 className="font-medium">Pago</h2>
          {pagoReembolso ? (
            <div className="rounded border border-black/10 p-3 text-sm dark:border-white/10">
              <p>
                Pagado: <span className="font-medium">${pagoReembolso.monto_pagado.toLocaleString('es-CL')}</span>
                {' · '}
                {pagoReembolso.medio_pago} · {pagoReembolso.fecha_pago}
              </p>
              <p className="text-zinc-500 dark:text-zinc-400">
                Registrado por {pagoReembolso.registrado_por_nombre ?? 'usuario desconocido'}
              </p>
              {pagoReembolso.observacion && (
                <p className="mt-1 whitespace-pre-wrap">{pagoReembolso.observacion}</p>
              )}
            </div>
          ) : puedeRegistrarPagoAhora ? (
            <>
              {decisionParaPago?.monto_aprobado !== null && decisionParaPago?.monto_aprobado !== undefined && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Monto aprobado: ${decisionParaPago.monto_aprobado.toLocaleString('es-CL')}
                </p>
              )}
              <RegistrarPagoForm action={registrarPagoConId} />
            </>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              La solicitud debe estar aprobada para registrar el pago.
            </p>
          )}
        </section>
      )}

      {puedeVerStock && (
        <section className="space-y-3">
          <h2 className="font-medium">Stock</h2>
          {puedeRegistrarSalidaStock ? (
            <SalidaStockForm action={registrarSalidaStockConId} productos={productos} />
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              La solicitud debe estar aprobada para registrar una salida de stock.
            </p>
          )}
          {movimientosStock.length > 0 && (
            <ul className="divide-y divide-black/10 rounded border border-black/10 text-sm dark:divide-white/10 dark:border-white/10">
              {movimientosStock.map((movimiento) => (
                <li key={movimiento.id} className="flex items-center justify-between px-4 py-2">
                  <span>
                    {movimiento.producto_nombre} · {movimiento.cantidad} {movimiento.producto_unidad_medida}
                    {movimiento.observacion ? ` · ${movimiento.observacion}` : ''}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {new Date(movimiento.created_at).toLocaleString('es-CL')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {puedeGestionarEntregas && (tipoAyuda?.requiere_entrega ?? false) && (
        <section className="space-y-3">
          <h2 className="font-medium">Entrega</h2>

          {!entrega && puedeCrearEntrega && (
            <EntregaAsignacionForm
              action={crearEntregaConId}
              funcionarios={funcionariosTerreno}
              submitLabel="Crear entrega"
            />
          )}
          {!entrega && !puedeCrearEntrega && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              La solicitud debe estar aprobada para generar una entrega.
            </p>
          )}

          {entrega && (
            <div className="space-y-3">
              <p className="text-sm">
                Estado: <span className="font-medium">{ESTADO_ENTREGA_LABELS[entrega.estado]}</span>
                {entrega.fecha_programada && ` · programada ${entrega.fecha_programada}`}
                {' · responsable: '}
                {entrega.responsable_nombre ?? 'sin asignar'}
              </p>

              {entrega.estado === 'pendiente' && asignarResponsableConId && (
                <EntregaAsignacionForm
                  action={asignarResponsableConId}
                  funcionarios={funcionariosTerreno}
                  submitLabel="Guardar asignación"
                />
              )}

              {entrega.estado === 'fallida' && (
                <div className="space-y-2">
                  <p className="text-sm text-amber-700 dark:text-amber-500">
                    Entrega fallida
                    {entrega.motivo_fallo_nombre && `: ${entrega.motivo_fallo_nombre}`}
                    {entrega.observacion_fallo && ` — ${entrega.observacion_fallo}`}
                  </p>
                  {reprogramarEntregaConId && (
                    <EntregaAsignacionForm
                      action={reprogramarEntregaConId}
                      funcionarios={funcionariosTerreno}
                      submitLabel="Reprogramar"
                      fechaRequerida
                    />
                  )}
                </div>
              )}

              {entrega.estado === 'realizada' && (
                <div className="rounded border border-black/10 p-3 text-sm dark:border-white/10">
                  <p>
                    Recibió: <span className="font-medium">{entrega.receptor_nombre}</span>
                    {entrega.receptor_relacion && ` (${entrega.receptor_relacion})`}
                  </p>
                  {entrega.fecha_hora_entrega && (
                    <p className="text-zinc-500 dark:text-zinc-400">
                      {new Date(entrega.fecha_hora_entrega).toLocaleString('es-CL')}
                    </p>
                  )}
                  {entrega.observacion_entrega && (
                    <p className="mt-1 whitespace-pre-wrap">{entrega.observacion_entrega}</p>
                  )}
                  {entrega.latitud !== null && entrega.longitud !== null && (
                    <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                      Ubicación: {entrega.latitud}, {entrega.longitud}
                    </p>
                  )}
                </div>
              )}

              {historialEntrega.length > 0 && (
                <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {historialEntrega.map((cambio) => (
                    <li key={cambio.id}>
                      {new Date(cambio.creado_en).toLocaleString('es-CL')} · {cambio.campo}:{' '}
                      {cambio.valor_anterior ?? '—'} → {cambio.valor_nuevo ?? '—'}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}

      {!puedeGestionarEntregas && (tipoAyuda?.requiere_entrega ?? false) && (
        <section className="space-y-3">
          <h2 className="font-medium">Entrega</h2>

          {!entregaLectura ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Sin entrega generada todavía.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm">
                Estado: <span className="font-medium">{ESTADO_ENTREGA_LABELS[entregaLectura.estado]}</span>
                {entregaLectura.fecha_programada && ` · programada ${entregaLectura.fecha_programada}`}
                {' · responsable: '}
                {entregaLectura.responsable_nombre ?? 'sin asignar'}
              </p>

              {entregaLectura.estado === 'fallida' && (
                <p className="text-sm text-amber-700 dark:text-amber-500">
                  Entrega fallida
                  {entregaLectura.motivo_fallo_nombre && `: ${entregaLectura.motivo_fallo_nombre}`}
                  {entregaLectura.observacion_fallo && ` — ${entregaLectura.observacion_fallo}`}
                </p>
              )}

              {entregaLectura.estado === 'realizada' && (
                <div className="rounded border border-black/10 p-3 text-sm dark:border-white/10">
                  <p>
                    Recibió: <span className="font-medium">{entregaLectura.receptor_nombre}</span>
                    {entregaLectura.receptor_relacion && ` (${entregaLectura.receptor_relacion})`}
                  </p>
                  {entregaLectura.fecha_hora_entrega && (
                    <p className="text-zinc-500 dark:text-zinc-400">
                      {new Date(entregaLectura.fecha_hora_entrega).toLocaleString('es-CL')}
                    </p>
                  )}
                  {entregaLectura.observacion_entrega && (
                    <p className="mt-1 whitespace-pre-wrap">{entregaLectura.observacion_entrega}</p>
                  )}
                  {entregaLectura.latitud !== null && entregaLectura.longitud !== null && (
                    <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                      Ubicación: {entregaLectura.latitud}, {entregaLectura.longitud}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {puedeVerSensible && (
        <section>
          <h2 className="font-medium">Historial de ayudas del hogar</h2>
          {posiblesDuplicados.length > 0 && (
            <p className="mt-2 rounded border border-amber-600/30 bg-amber-600/10 px-4 py-2 text-sm text-amber-700 dark:text-amber-500">
              Posible duplicidad: este hogar tiene {posiblesDuplicados.length} solicitud
              {posiblesDuplicados.length > 1 ? 'es' : ''} más de &quot;{solicitud.tipo_ayuda_nombre}
              &quot; que no está{posiblesDuplicados.length > 1 ? 'n' : ''} rechazada
              {posiblesDuplicados.length > 1 ? 's' : ''} ni anulada
              {posiblesDuplicados.length > 1 ? 's' : ''}.
            </p>
          )}
          {ayudasPrevias.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Sin otras solicitudes registradas para este hogar.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
              {ayudasPrevias.map((previa) => {
                const esDuplicado = posiblesDuplicados.some((d) => d.id === previa.id)
                return (
                  <li key={previa.id}>
                    <Link
                      href={`/solicitudes/${previa.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <span>
                        <span className="font-medium">{previa.tipo_ayuda_nombre}</span>
                        <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                          {previa.fecha_solicitud}
                        </span>
                        {esDuplicado && (
                          <span className="ml-2 text-xs text-amber-600">posible duplicado</span>
                        )}
                      </span>
                      <span className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
                        {ESTADO_SOLICITUD_LABELS[previa.estado]}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      {puedeGestionar && (
        <section className="flex flex-wrap items-start gap-4">
          {ESTADOS_EDITABLES.includes(solicitud.estado) && (
            <EnviarEvaluacionButton solicitudId={solicitud.id} />
          )}
          {ESTADOS_ANULABLES.includes(solicitud.estado) && (
            <form action={anularConId}>
              <button
                type="submit"
                className="rounded border border-red-600/30 px-4 py-2 text-sm font-medium text-red-600"
              >
                Anular solicitud
              </button>
            </form>
          )}
        </section>
      )}

      {puedeObservar && solicitud.estado === 'en_evaluacion' && (
        <section>
          <h2 className="mb-2 font-medium">Observar solicitud</h2>
          <ObservarForm solicitudId={solicitud.id} />
        </section>
      )}

      {puedeObservar && solicitud.estado === 'observada' && (
        <section>
          <form action={volverAEvaluacionConId}>
            <button
              type="submit"
              className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              Volver a evaluación
            </button>
          </form>
        </section>
      )}

      {puedeVerSensible && (
        <section>
          <h2 className="font-medium">Evaluación social</h2>

          {evaluaciones.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Sin evaluaciones registradas todavía.
            </p>
          ) : (
            <ul className="mt-2 space-y-3">
              {evaluaciones.map((evaluacion) => (
                <li
                  key={evaluacion.id}
                  className="rounded border border-black/10 p-3 text-sm dark:border-white/10"
                >
                  <p className="font-medium">
                    {RECOMENDACION_LABELS[evaluacion.recomendacion]} ·{' '}
                    <span className="font-normal text-zinc-500 dark:text-zinc-400">
                      {evaluacion.evaluador_nombre ?? 'Evaluador'} ·{' '}
                      {new Date(evaluacion.created_at).toLocaleString('es-CL')}
                    </span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{evaluacion.fundamento}</p>
                </li>
              ))}
            </ul>
          )}

          {puedeEvaluar && solicitud.estado === 'en_evaluacion' && (
            <div className="mt-4">
              <EvaluacionForm solicitudId={solicitud.id} />
            </div>
          )}
        </section>
      )}

      {puedeVerInformes && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Informe social</h2>
            {puedeRegistrarInformes && (
              <Link
                href={`/hogares/${solicitud.grupo_familiar_id}/informes-sociales/nuevo?solicitud_id=${solicitud.id}`}
                className="rounded border border-black/10 px-3 py-1.5 text-sm font-medium dark:border-white/20"
              >
                Registrar informe para esta solicitud
              </Link>
            )}
          </div>

          {rshSuperaUmbral && informesSociales.length === 0 && (
            <p className="mt-2 rounded border border-amber-600/30 bg-amber-600/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-500">
              Este hogar supera el {UMBRAL_ELEGIBILIDAD_RSH}% RSH. No se puede aprobar por excepción
              (US-05.05) hasta registrar un informe social asociado a esta solicitud.
            </p>
          )}

          {esReembolsoExcepcional && informesSociales.length === 0 && (
            <p className="mt-2 rounded border border-amber-600/30 bg-amber-600/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-500">
              Este reembolso excepcional no se puede aprobar (US-25.01/25.04) hasta registrar un informe
              social asociado a esta solicitud.
            </p>
          )}

          {informesSociales.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Sin informes sociales asociados a esta solicitud.
            </p>
          ) : (
            <ul className="mt-2 space-y-3">
              {informesSociales.map((informe) => (
                <li key={informe.id} className="rounded border border-black/10 p-3 text-sm dark:border-white/10">
                  <p className="font-medium">
                    {informe.motivo} ·{' '}
                    <span className="font-normal text-zinc-500 dark:text-zinc-400">
                      {informe.creado_por_nombre ?? 'Asistente social'} · {informe.fecha_informe}
                    </span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{informe.recomendacion_profesional}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {puedeVerSensible && decision && (
        <section>
          <h2 className="font-medium">Decisión</h2>
          <div className="mt-2 rounded border border-black/10 p-3 text-sm dark:border-white/10">
            <p className="font-medium">
              {DECISION_LABELS[decision.decision]} ·{' '}
              <span className="font-normal text-zinc-500 dark:text-zinc-400">
                {decision.aprobador_nombre ?? 'Aprobador'} ·{' '}
                {new Date(decision.created_at).toLocaleString('es-CL')}
              </span>
            </p>
            {decision.monto_aprobado !== null && (
              <p className="mt-1">Monto aprobado: ${decision.monto_aprobado.toLocaleString('es-CL')}</p>
            )}
            {decision.cantidad_aprobada !== null && (
              <p className="mt-1">Cantidad/detalle aprobado: {decision.cantidad_aprobada}</p>
            )}
            {decision.autoridad_solicitante && (
              <p className="mt-1">Autoridad solicitante: {decision.autoridad_solicitante}</p>
            )}
            {decision.comentario && (
              <p className="mt-1 whitespace-pre-wrap">{decision.comentario}</p>
            )}
          </div>
        </section>
      )}

      {puedeAprobar && solicitud.estado === 'en_evaluacion' && (
        <section>
          <h2 className="mb-2 font-medium">Decisión de aprobación</h2>
          {rshSuperaUmbral && (
            <p className="mb-3 rounded border border-amber-600/30 bg-amber-600/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-500">
              Este hogar tiene un tramo RSH de {hogar?.tramo_rsh}%, superior al {UMBRAL_ELEGIBILIDAD_RSH}%
              permitido para el flujo regular (US-05.04) — la aprobación normal quedará bloqueada. Usa
              &quot;Aprobar por excepción&quot; más abajo, con un informe social asociado.
            </p>
          )}
          {evaluaciones.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No se puede decidir sin al menos una evaluación social registrada.
            </p>
          ) : (
            <div className="flex flex-wrap gap-8">
              <AprobarForm
                solicitudId={solicitud.id}
                esReembolso={esReembolso}
                topeReembolsoGeneral={topeReembolsoGeneral}
                topeDialisis={topeDialisis}
                remanenteExcepcional={remanenteExcepcional}
              />
              <RechazarForm solicitudId={solicitud.id} />
              {puedeAprobarExcepcionDialisis && <ExcepcionDialisisForm solicitudId={solicitud.id} />}
              {puedeAprobarExcepcionRsh && informesSociales.length > 0 && (
                <ExcepcionRshForm solicitudId={solicitud.id} esReembolso={esReembolso} />
              )}
            </div>
          )}
        </section>
      )}

      {puedeVerSensible && (
        <section>
          <h2 className="font-medium">Historial</h2>
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
