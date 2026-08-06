'use client'

import {
  listarCola,
  encolar,
  actualizarItemCola,
  eliminarItemCola,
  marcarEntregaLocal,
  listarMotivosFalloCache,
  type ItemColaSync,
  type EntregaLocal,
  type ArchivoEncolado,
} from './db'

// EPIC 27 (US-27.05/US-27.06/US-27.07) — motor de sincronización: intenta
// vaciar la cola local apenas hay señal, sin acción manual del funcionario.
// No se usa la Background Sync API del navegador (navigator.serviceWorker
// .ready.sync) porque no está soportada en Safari/iOS — dado que el alcance
// de este EPIC es "cortes momentáneos con la app abierta" (no sincronización
// en segundo plano con la app cerrada), un listener de `online` + un
// intervalo corto mientras la pestaña está abierta cubre el caso real sin
// depender de una API con soporte parcial.
export type EstadoSyncGlobal = { pendientes: number; errores: number }

type Suscriptor = (estado: EstadoSyncGlobal) => void
const suscriptores = new Set<Suscriptor>()

export function suscribirseSync(cb: Suscriptor): () => void {
  suscriptores.add(cb)
  return () => {
    suscriptores.delete(cb)
  }
}

async function notificar(): Promise<void> {
  const estado = await obtenerEstadoCola()
  suscriptores.forEach((cb) => cb(estado))
}

export async function obtenerEstadoCola(): Promise<EstadoSyncGlobal> {
  const cola = await listarCola()
  return {
    pendientes: cola.filter((i) => i.estado === 'pendiente').length,
    errores: cola.filter((i) => i.estado === 'error').length,
  }
}

function construirFormData(item: Pick<ItemColaSync, 'campos' | 'archivo' | 'capturadoEn'>): FormData {
  const formData = new FormData()
  for (const [clave, valor] of Object.entries(item.campos)) {
    formData.set(clave, valor)
  }
  formData.set('capturado_en', item.capturadoEn)
  if (item.archivo) {
    formData.set('tipo_documento', 'fotografia')
    formData.set('archivo', new File([item.archivo.datos], item.archivo.nombre, { type: item.archivo.tipo }))
  }
  return formData
}

// El envío inmediato (enviarOEncolar, llamado desde el formulario) ya sabe
// qué mostrar de inmediato porque lo construye el propio formulario. Pero
// cuando la sincronización ocurre más tarde en segundo plano (este motor,
// sin que el formulario siga montado — ej. se cerró y reabrió la app antes
// de que hubiera señal), la única fuente de verdad disponible es el propio
// ítem de la cola: sin este mapeo, `estado` se quedaba "pendiente" en el
// caché local aunque el servidor ya tuviera el resultado, mostrando de
// nuevo el formulario de registro para una entrega que ya estaba resuelta.
async function derivarActualizacionLocal(item: ItemColaSync): Promise<Partial<EntregaLocal>> {
  if (item.tipo === 'realizada') {
    const latitud = item.campos.latitud
    const longitud = item.campos.longitud
    return {
      estado: 'realizada',
      receptor_nombre: item.campos.receptor_nombre ?? null,
      receptor_relacion: item.campos.receptor_relacion || null,
      observacion_entrega: item.campos.observacion || null,
      fecha_hora_entrega: item.campos.fecha_hora ? new Date(item.campos.fecha_hora).toISOString() : item.capturadoEn,
      latitud: latitud ? Number(latitud) : null,
      longitud: longitud ? Number(longitud) : null,
    }
  }

  const motivos = await listarMotivosFalloCache()
  const motivo = motivos.find((m) => m.id === item.campos.motivo_fallo)
  return {
    estado: 'fallida',
    motivo_fallo: item.campos.motivo_fallo ?? null,
    motivo_fallo_nombre: motivo?.nombre ?? null,
    observacion_fallo: item.campos.observacion || null,
  }
}

async function procesarItem(item: ItemColaSync): Promise<void> {
  const url = `/api/mis-entregas/${item.entregaId}/${item.tipo}`
  let respuesta: Response
  try {
    respuesta = await fetch(url, { method: 'POST', body: construirFormData(item) })
  } catch {
    // Sin conexión (u otro error de red): se deja en la cola, se reintenta
    // en el próximo ciclo — US-27.05 "si falla, se reintenta
    // automáticamente sin perder los datos locales".
    await actualizarItemCola(item.id, { intentos: item.intentos + 1 })
    return
  }

  if (respuesta.ok) {
    await eliminarItemCola(item.id)
    const actualizacion = await derivarActualizacionLocal(item)
    await marcarEntregaLocal(item.entregaId, { ...actualizacion, estado_local: 'sincronizada' })
    return
  }

  if (respuesta.status === 409) {
    // Conflicto: el servidor ya decidió (última captura gana) y dejó
    // constancia en entregas_historial (US-27.07) — no se reintenta un
    // conflicto ya resuelto.
    await eliminarItemCola(item.id)
    await marcarEntregaLocal(item.entregaId, { estado_local: 'sincronizada' })
    return
  }

  // Rechazo definitivo del servidor (400/404/500): reintentarlo sin cambios
  // fallaría siempre igual — se marca como error visible (US-27.06) en vez
  // de reintentar indefinidamente.
  const cuerpo = await respuesta.json().catch(() => ({ error: `Error ${respuesta.status}` }))
  await actualizarItemCola(item.id, {
    estado: 'error',
    errorMensaje: cuerpo.error ?? `Error ${respuesta.status}`,
    intentos: item.intentos + 1,
  })
}

let enCurso = false

export async function intentarVaciarCola(): Promise<void> {
  if (enCurso) return
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return

  enCurso = true
  try {
    const cola = await listarCola()
    for (const item of cola.filter((i) => i.estado === 'pendiente')) {
      await procesarItem(item)
    }
  } finally {
    enCurso = false
    await notificar()
  }
}

export type DatosRegistroOffline = {
  entregaId: string
  tipo: 'realizada' | 'fallida'
  campos: Record<string, string>
  archivo: ArchivoEncolado | null
  capturadoEn: string
}

// US-27.03/US-27.04: encola el resultado (y su evidencia) sin bloquear al
// funcionario — `actualizacionLocal` es lo que ya se refleja de inmediato en
// la lista/detalle en pantalla, antes de que exista confirmación del
// servidor.
export async function encolarRegistro(
  datos: DatosRegistroOffline,
  actualizacionLocal: Partial<EntregaLocal>
): Promise<void> {
  await encolar(datos)
  await marcarEntregaLocal(datos.entregaId, { ...actualizacionLocal, estado_local: 'pendiente_sincronizar' })
  await notificar()
  void intentarVaciarCola()
}

// Usado por los formularios de registro (mis-entregas-offline.tsx): intenta
// enviar directo por fetch (rápido, camino feliz con señal); si la red falla
// (offline), cae a la cola local sin bloquear al funcionario — US-27.03
// "puede seguir avanzando... sin que el estado offline lo bloquee".
export async function enviarOEncolar(
  url: string,
  construirFormDataOnline: () => FormData,
  datosOffline: DatosRegistroOffline,
  actualizacionLocal: Partial<EntregaLocal>
): Promise<{ error?: string; encolado: boolean }> {
  try {
    const respuesta = await fetch(url, { method: 'POST', body: construirFormDataOnline() })
    if (respuesta.ok) {
      await marcarEntregaLocal(datosOffline.entregaId, { ...actualizacionLocal, estado_local: 'sincronizada' })
      return { encolado: false }
    }
    const cuerpo = await respuesta.json().catch(() => ({}))
    return { error: cuerpo.error ?? 'No se pudo registrar la entrega.', encolado: false }
  } catch {
    await encolarRegistro(datosOffline, actualizacionLocal)
    return { encolado: true }
  }
}

export function iniciarSincronizacionAutomatica(): () => void {
  if (typeof window === 'undefined') return () => {}

  const manejarOnline = () => void intentarVaciarCola()
  window.addEventListener('online', manejarOnline)
  // Respaldo: el evento `online` no es 100% confiable en todos los
  // navegadores/SO — un intervalo corto mientras la pestaña está abierta
  // cubre ese caso sin depender de la Background Sync API (ver comentario
  // de arriba).
  const intervalo = window.setInterval(() => void intentarVaciarCola(), 20000)
  void intentarVaciarCola()

  return () => {
    window.removeEventListener('online', manejarOnline)
    window.clearInterval(intervalo)
  }
}
