'use client'

import type { EntregaConContexto } from '@/lib/entregas/types'
import type { MotivoEntregaFallida } from '@/lib/motivos-entrega/types'
import { fechaHoyChile } from '@/lib/fechas'

// EPIC 27 — capa de persistencia local para el modo offline de terreno.
// IndexedDB nativo (sin dependencia nueva: la superficie que se necesita —
// dos object stores simples con lecturas/escrituras por clave — no
// justifica agregar una librería). Dos stores:
// - `ruta`: la ruta del día (US-27.02), con un `estado_local` que superpone
//   el estado real de la fila con si tiene una escritura pendiente de
//   sincronizar (US-27.06 lee esto para el indicador).
// - `cola_sync`: registros de entrega/evidencia capturados sin conexión,
//   pendientes de enviar (US-27.03/US-27.04) — sobrevive cierre de app o
//   apagado del teléfono porque IndexedDB es persistente en disco.
const DB_NOMBRE = 'ayudas-offline'
const DB_VERSION = 1
const STORE_RUTA = 'ruta'
const STORE_COLA = 'cola_sync'
const STORE_MOTIVOS = 'motivos_fallo'

export type EstadoLocalEntrega = 'sincronizada' | 'pendiente_sincronizar'

export type EntregaLocal = EntregaConContexto & { estado_local: EstadoLocalEntrega }

export type ArchivoEncolado = { datos: Blob; nombre: string; tipo: string }

export type ItemColaSync = {
  id: string
  entregaId: string
  tipo: 'realizada' | 'fallida'
  campos: Record<string, string>
  archivo: ArchivoEncolado | null
  capturadoEn: string
  intentos: number
  estado: 'pendiente' | 'error'
  errorMensaje: string | null
}

function abrirDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const solicitud = indexedDB.open(DB_NOMBRE, DB_VERSION)
    solicitud.onupgradeneeded = () => {
      const db = solicitud.result
      if (!db.objectStoreNames.contains(STORE_RUTA)) {
        db.createObjectStore(STORE_RUTA, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_COLA)) {
        db.createObjectStore(STORE_COLA, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_MOTIVOS)) {
        db.createObjectStore(STORE_MOTIVOS, { keyPath: 'id' })
      }
    }
    solicitud.onsuccess = () => resolve(solicitud.result)
    solicitud.onerror = () => reject(solicitud.error)
  })
}

function pedir<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function completarTx(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export async function listarRutaDelDia(): Promise<EntregaLocal[]> {
  const db = await abrirDb()
  const tx = db.transaction(STORE_RUTA, 'readonly')
  const filas = await pedir(tx.objectStore(STORE_RUTA).getAll())
  return ordenarRutaDelDia(filas as EntregaLocal[])
}

// US-27.02: "la ruta cacheada se limita a la jornada/día en curso" — se
// guarda lo programado para hoy, lo que no tiene fecha todavía (backlog sin
// programar no es "un día futuro ni anterior") y las entregas atrasadas: las
// de días anteriores que siguen pendientes. Decisión 2026-10-27: una entrega
// atrasada sigue siendo trabajo del día y no puede desaparecer de la vista
// del repartidor (antes solo la mostraba /rutas); se marca como "Atrasada"
// (ver esAtrasada). Lo ya realizado o fallido de días anteriores no entra.
// Preserva `estado_local` de
// cualquier entrega que siga con una escritura pendiente de sincronizar,
// para no perder ese aviso si la lista se recarga antes de que sincronice.
export async function guardarRutaDelDia(entregas: EntregaConContexto[]): Promise<EntregaLocal[]> {
  const hoy = fechaHoyChile()
  const deHoy = entregas.filter(
    (e) => !e.fecha_programada || e.fecha_programada === hoy || esAtrasada(e, hoy)
  )

  const anteriores = await listarRutaDelDia()
  const anterioresPorId = new Map(anteriores.map((e) => [e.id, e]))

  const db = await abrirDb()
  const tx = db.transaction(STORE_RUTA, 'readwrite')
  const store = tx.objectStore(STORE_RUTA)
  store.clear()

  const resultado: EntregaLocal[] = deHoy.map((entrega) => {
    const previa = anterioresPorId.get(entrega.id)
    const local: EntregaLocal = {
      ...entrega,
      estado_local:
        previa?.estado_local === 'pendiente_sincronizar' && entrega.estado === 'pendiente'
          ? 'pendiente_sincronizar'
          : 'sincronizada',
    }
    store.put(local)
    return local
  })

  await completarTx(tx)
  return ordenarRutaDelDia(resultado)
}

export async function marcarEntregaLocal(
  entregaId: string,
  cambios: Partial<EntregaLocal>
): Promise<void> {
  const db = await abrirDb()
  const tx = db.transaction(STORE_RUTA, 'readwrite')
  const store = tx.objectStore(STORE_RUTA)
  const actual = (await pedir(store.get(entregaId))) as EntregaLocal | undefined
  if (actual) {
    store.put({ ...actual, ...cambios })
  }
  await completarTx(tx)
}

export async function listarCola(): Promise<ItemColaSync[]> {
  const db = await abrirDb()
  const tx = db.transaction(STORE_COLA, 'readonly')
  const filas = await pedir(tx.objectStore(STORE_COLA).getAll())
  return filas as ItemColaSync[]
}

export async function encolar(item: Omit<ItemColaSync, 'id' | 'intentos' | 'estado' | 'errorMensaje'>): Promise<ItemColaSync> {
  const nuevo: ItemColaSync = {
    ...item,
    id: crypto.randomUUID(),
    intentos: 0,
    estado: 'pendiente',
    errorMensaje: null,
  }
  const db = await abrirDb()
  const tx = db.transaction(STORE_COLA, 'readwrite')
  tx.objectStore(STORE_COLA).put(nuevo)
  await completarTx(tx)
  return nuevo
}

export async function actualizarItemCola(id: string, cambios: Partial<ItemColaSync>): Promise<void> {
  const db = await abrirDb()
  const tx = db.transaction(STORE_COLA, 'readwrite')
  const store = tx.objectStore(STORE_COLA)
  const actual = (await pedir(store.get(id))) as ItemColaSync | undefined
  if (actual) {
    store.put({ ...actual, ...cambios })
  }
  await completarTx(tx)
}

export async function eliminarItemCola(id: string): Promise<void> {
  const db = await abrirDb()
  const tx = db.transaction(STORE_COLA, 'readwrite')
  tx.objectStore(STORE_COLA).delete(id)
  await completarTx(tx)
}

// US-27.04: el formulario de "entrega fallida" necesita el catálogo de
// motivos también sin conexión (es un <select> obligatorio) — se cachea
// junto con la ruta del día, en la misma carga inicial online.
export async function guardarMotivosFallo(motivos: MotivoEntregaFallida[]): Promise<void> {
  const db = await abrirDb()
  const tx = db.transaction(STORE_MOTIVOS, 'readwrite')
  const store = tx.objectStore(STORE_MOTIVOS)
  store.clear()
  motivos.forEach((motivo) => store.put(motivo))
  await completarTx(tx)
}

export async function listarMotivosFalloCache(): Promise<MotivoEntregaFallida[]> {
  const db = await abrirDb()
  const tx = db.transaction(STORE_MOTIVOS, 'readonly')
  const filas = await pedir(tx.objectStore(STORE_MOTIVOS).getAll())
  return filas as MotivoEntregaFallida[]
}

// Entrega pendiente cuya fecha programada ya pasó.
export function esAtrasada(
  entrega: { estado: string; fecha_programada: string | null },
  hoy: string = fechaHoyChile()
): boolean {
  return entrega.estado === 'pendiente' && entrega.fecha_programada !== null && entrega.fecha_programada < hoy
}

// IndexedDB devuelve las filas por clave (id), no por fecha: se ordena
// explícitamente, primero las atrasadas (las que más urgen) y luego por
// fecha programada; sin fecha al final.
function ordenarRutaDelDia(entregas: EntregaLocal[]): EntregaLocal[] {
  const hoy = fechaHoyChile()
  return [...entregas].sort((a, b) => {
    const atrasoA = esAtrasada(a, hoy) ? 0 : 1
    const atrasoB = esAtrasada(b, hoy) ? 0 : 1
    if (atrasoA !== atrasoB) return atrasoA - atrasoB
    return (a.fecha_programada ?? '9999-12-31').localeCompare(b.fecha_programada ?? '9999-12-31')
  })
}
