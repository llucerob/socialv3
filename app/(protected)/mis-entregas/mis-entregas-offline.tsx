'use client'

import { useEffect, useState } from 'react'
import type { RealizadaFormState, FallidaFormState } from '@/lib/entregas/actions'
import type { EntregaConContexto } from '@/lib/entregas/types'
import { ESTADO_ENTREGA_LABELS } from '@/lib/entregas/types'
import type { MotivoEntregaFallida } from '@/lib/motivos-entrega/types'
import { enlaceMapa } from '@/lib/rutas/mapas'
import {
  guardarRutaDelDia,
  listarRutaDelDia,
  guardarMotivosFallo,
  listarMotivosFalloCache,
  type EntregaLocal,
} from '@/lib/offline/db'
import { enviarOEncolar, iniciarSincronizacionAutomatica, suscribirseSync } from '@/lib/offline/sync'
import { EntregaRealizadaForm } from './entrega-realizada-form'
import { EntregaFallidaForm } from './entrega-fallida-form'
import { IndicadorSincronizacion } from './sync-indicator'

type Vista = { tipo: 'lista' } | { tipo: 'detalle'; entregaId: string }

// EPIC 27 — pieza central del modo offline de terreno. Reemplaza el <ul>
// estático que tenía mis-entregas/page.tsx (US-12.03) por una vista con
// maestro-detalle manejado por estado local de React, no por navegación de
// Next.js — así avanzar de una entrega a la siguiente (US-27.03) no depende
// de poder pedir al servidor el RSC de /mis-entregas/[id] en ese momento.
// Con `entregasIniciales` (caso online, mis-entregas/page.tsx) persiste esa
// ruta en IndexedDB y arranca desde ahí; sin ellas (caso offline — ver
// app/offline/page.tsx, servida por el service worker cuando la navegación
// falla) lee directamente lo último cacheado.
export function MisEntregasOffline({
  entregasIniciales,
  motivosIniciales,
}: {
  entregasIniciales: EntregaConContexto[] | null
  motivosIniciales: MotivoEntregaFallida[] | null
}) {
  const [entregas, setEntregas] = useState<EntregaLocal[]>([])
  const [motivos, setMotivos] = useState<MotivoEntregaFallida[]>([])
  const [vista, setVista] = useState<Vista>({ tipo: 'lista' })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true

    async function cargar() {
      if (entregasIniciales) {
        const [guardadas] = await Promise.all([
          guardarRutaDelDia(entregasIniciales),
          motivosIniciales ? guardarMotivosFallo(motivosIniciales) : Promise.resolve(),
        ])
        if (!activo) return
        setEntregas(guardadas)
        setMotivos(motivosIniciales ?? [])
      } else {
        const [rutaCache, motivosCache] = await Promise.all([listarRutaDelDia(), listarMotivosFalloCache()])
        if (!activo) return
        setEntregas(rutaCache)
        setMotivos(motivosCache)
      }
      if (activo) setCargando(false)
    }

    cargar()
    const detenerSync = iniciarSincronizacionAutomatica()
    const cancelarSuscripcion = suscribirseSync(() => {
      listarRutaDelDia().then((actual) => {
        if (activo) setEntregas(actual)
      })
    })

    return () => {
      activo = false
      detenerSync()
      cancelarSuscripcion()
    }
    // Solo debe correr una vez por montaje: entregasIniciales/motivosIniciales
    // son la foto del primer render (props del Server Component padre), no
    // deben reiniciar la carga si el propio estado local cambia después.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function aplicarActualizacionLocal(entregaId: string, cambios: Partial<EntregaLocal>) {
    setEntregas((prev) => prev.map((e) => (e.id === entregaId ? { ...e, ...cambios } : e)))
  }

  if (cargando) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Cargando…</p>
  }

  if (vista.tipo === 'detalle') {
    const entrega = entregas.find((e) => e.id === vista.entregaId)
    if (!entrega) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Esta entrega ya no está disponible localmente.</p>
          <button type="button" onClick={() => setVista({ tipo: 'lista' })} className="text-sm underline">
            Volver a la ruta
          </button>
        </div>
      )
    }
    return (
      <DetalleEntrega
        entrega={entrega}
        motivos={motivos}
        onVolver={() => setVista({ tipo: 'lista' })}
        onActualizar={aplicarActualizacionLocal}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Mis entregas</h1>
        <IndicadorSincronizacion />
      </div>

      {entregas.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No tienes entregas asignadas para hoy.</p>
      ) : (
        <ul className="space-y-3">
          {entregas.map((entrega) => (
            <li key={entrega.id} className="rounded border border-black/10 p-4 dark:border-white/10">
              <div className="flex items-center justify-between gap-2">
                <span className="text-base font-medium">{entrega.tipo_ayuda_nombre}</span>
                <div className="flex shrink-0 items-center gap-2">
                  {entrega.estado_local === 'pendiente_sincronizar' && (
                    <span className="rounded-full border border-amber-600/30 bg-amber-600/10 px-2 py-0.5 text-xs whitespace-nowrap text-amber-700 dark:text-amber-500">
                      Pendiente de sincronizar
                    </span>
                  )}
                  <span className="rounded bg-black/5 px-2 py-1 text-xs font-medium uppercase dark:bg-white/10">
                    {ESTADO_ENTREGA_LABELS[entrega.estado]}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {entrega.grupo_familiar_direccion}
                {entrega.grupo_familiar_sector && ` · ${entrega.grupo_familiar_sector}`}
              </p>
              {entrega.persona_nombre && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{entrega.persona_nombre}</p>
              )}
              {entrega.fecha_programada && (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Programada: {entrega.fecha_programada}
                </p>
              )}
              <div className="mt-3 flex items-center gap-4 text-sm">
                <button
                  type="button"
                  onClick={() => setVista({ tipo: 'detalle', entregaId: entrega.id })}
                  className="font-medium underline"
                >
                  Ver detalle
                </button>
                <a href={enlaceMapa(entrega)} target="_blank" rel="noopener noreferrer" className="underline">
                  Abrir en mapas
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DetalleEntrega({
  entrega,
  motivos,
  onVolver,
  onActualizar,
}: {
  entrega: EntregaLocal
  motivos: MotivoEntregaFallida[]
  onVolver: () => void
  onActualizar: (entregaId: string, cambios: Partial<EntregaLocal>) => void
}) {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <button type="button" onClick={onVolver} className="text-sm underline">
        ← Volver a la ruta
      </button>

      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{entrega.tipo_ayuda_nombre}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {entrega.grupo_familiar_direccion}
            {entrega.grupo_familiar_sector && ` · ${entrega.grupo_familiar_sector}`}
          </p>
          {entrega.persona_nombre && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{entrega.persona_nombre}</p>
          )}
          <p className="mt-2 text-sm">
            Estado: <span className="font-medium">{ESTADO_ENTREGA_LABELS[entrega.estado]}</span>
          </p>
          <a
            href={enlaceMapa(entrega)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-sm underline"
          >
            Abrir en mapas
          </a>
        </div>
        {entrega.estado_local === 'pendiente_sincronizar' && (
          <span className="shrink-0 rounded-full border border-amber-600/30 bg-amber-600/10 px-2 py-0.5 text-xs whitespace-nowrap text-amber-700 dark:text-amber-500">
            Pendiente de sincronizar
          </span>
        )}
      </div>

      {entrega.estado === 'pendiente' && (
        <div className="space-y-8">
          <EntregaRealizadaForm
            action={crearAccionRealizada(entrega, onActualizar)}
            requiereEvidencia={entrega.tipo_ayuda_requiere_evidencia}
          />
          <div className="border-t border-black/10 pt-6 dark:border-white/10">
            <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">¿No se pudo entregar?</h2>
            <EntregaFallidaForm action={crearAccionFallida(entrega, motivos, onActualizar)} motivos={motivos} />
          </div>
        </div>
      )}

      {entrega.estado === 'fallida' && (
        <p className="text-sm text-amber-700 dark:text-amber-500">
          Entrega marcada como fallida
          {entrega.motivo_fallo_nombre && `: ${entrega.motivo_fallo_nombre}`}. Bodega debe reprogramarla antes de un
          nuevo intento.
        </p>
      )}

      {entrega.estado === 'realizada' && (
        <div className="rounded border border-black/10 p-4 text-sm dark:border-white/10">
          <p>
            Recibió: <span className="font-medium">{entrega.receptor_nombre}</span>
            {entrega.receptor_relacion && ` (${entrega.receptor_relacion})`}
          </p>
          {entrega.fecha_hora_entrega && (
            <p className="text-zinc-500 dark:text-zinc-400">
              {new Date(entrega.fecha_hora_entrega).toLocaleString('es-CL')}
            </p>
          )}
          {entrega.observacion_entrega && <p className="mt-1 whitespace-pre-wrap">{entrega.observacion_entrega}</p>}
        </div>
      )}
    </div>
  )
}

// US-27.03/US-27.04/US-27.05 — mismo componente de formulario que la
// versión online (EntregaRealizadaForm, sin cambios), pero con un `action`
// que intenta fetch directo y cae a la cola local si falla — en vez de una
// Server Action atada a mis-entregas/[id]/page.tsx, que no es fetcheable
// desde una cola de reintento.
function crearAccionRealizada(
  entrega: EntregaLocal,
  onActualizar: (entregaId: string, cambios: Partial<EntregaLocal>) => void
) {
  return async (_prevState: RealizadaFormState, formData: FormData): Promise<RealizadaFormState> => {
    const receptorNombre = formData.get('receptor_nombre')?.toString().trim() ?? ''
    const receptorRelacion = formData.get('receptor_relacion')?.toString().trim() ?? ''
    const observacion = formData.get('observacion')?.toString().trim() ?? ''
    const fechaHora = formData.get('fecha_hora')?.toString().trim() ?? ''
    const latitud = formData.get('latitud')?.toString().trim() ?? ''
    const longitud = formData.get('longitud')?.toString().trim() ?? ''
    const valores = {
      fecha_hora: fechaHora,
      receptor_nombre: receptorNombre,
      receptor_relacion: receptorRelacion,
      observacion,
    }

    if (!receptorNombre) {
      return { error: 'El nombre de quien recibe es obligatorio.', valores }
    }

    const archivo = formData.get('archivo')
    const tieneArchivo = archivo instanceof File && archivo.size > 0
    // US-27.05: "fecha y hora original de captura, no la de sincronización"
    // — se fija AQUÍ, en el instante del intento (offline u online), no en
    // la ruta API que eventualmente la reciba.
    const capturadoEn = fechaHora ? new Date(fechaHora).toISOString() : new Date().toISOString()

    const actualizacionLocal: Partial<EntregaLocal> = {
      estado: 'realizada',
      receptor_nombre: receptorNombre,
      receptor_relacion: receptorRelacion || null,
      observacion_entrega: observacion || null,
      fecha_hora_entrega: capturadoEn,
      latitud: latitud ? Number(latitud) : null,
      longitud: longitud ? Number(longitud) : null,
    }

    const resultado = await enviarOEncolar(
      `/api/mis-entregas/${entrega.id}/realizada`,
      () => {
        const formDataEnvio = new FormData()
        formDataEnvio.set('receptor_nombre', receptorNombre)
        formDataEnvio.set('receptor_relacion', receptorRelacion)
        formDataEnvio.set('observacion', observacion)
        formDataEnvio.set('fecha_hora', fechaHora)
        formDataEnvio.set('latitud', latitud)
        formDataEnvio.set('longitud', longitud)
        formDataEnvio.set('capturado_en', capturadoEn)
        if (tieneArchivo) {
          formDataEnvio.set('tipo_documento', 'fotografia')
          formDataEnvio.set('archivo', archivo as File)
        }
        return formDataEnvio
      },
      {
        entregaId: entrega.id,
        tipo: 'realizada',
        campos: {
          receptor_nombre: receptorNombre,
          receptor_relacion: receptorRelacion,
          observacion,
          fecha_hora: fechaHora,
          latitud,
          longitud,
        },
        archivo: tieneArchivo
          ? { datos: archivo as File, nombre: (archivo as File).name, tipo: (archivo as File).type }
          : null,
        capturadoEn,
      },
      actualizacionLocal
    )

    if (resultado.error) {
      return { error: resultado.error, valores }
    }

    onActualizar(entrega.id, { ...actualizacionLocal, estado_local: resultado.encolado ? 'pendiente_sincronizar' : 'sincronizada' })
    return undefined
  }
}

function crearAccionFallida(
  entrega: EntregaLocal,
  motivos: MotivoEntregaFallida[],
  onActualizar: (entregaId: string, cambios: Partial<EntregaLocal>) => void
) {
  return async (_prevState: FallidaFormState, formData: FormData): Promise<FallidaFormState> => {
    const motivoFallo = formData.get('motivo_fallo')?.toString().trim() ?? ''
    const observacion = formData.get('observacion')?.toString().trim() ?? ''
    const valores = { motivo_fallo: motivoFallo, observacion }

    const motivo = motivos.find((m) => m.id === motivoFallo)
    if (!motivo || motivo.estado !== 'activo') {
      return { error: 'Selecciona un motivo válido.', valores }
    }

    const capturadoEn = new Date().toISOString()

    const actualizacionLocal: Partial<EntregaLocal> = {
      estado: 'fallida',
      motivo_fallo: motivoFallo,
      motivo_fallo_nombre: motivo.nombre,
      observacion_fallo: observacion || null,
    }

    const resultado = await enviarOEncolar(
      `/api/mis-entregas/${entrega.id}/fallida`,
      () => {
        const formDataEnvio = new FormData()
        formDataEnvio.set('motivo_fallo', motivoFallo)
        formDataEnvio.set('observacion', observacion)
        formDataEnvio.set('capturado_en', capturadoEn)
        return formDataEnvio
      },
      {
        entregaId: entrega.id,
        tipo: 'fallida',
        campos: { motivo_fallo: motivoFallo, observacion },
        archivo: null,
        capturadoEn,
      },
      actualizacionLocal
    )

    if (resultado.error) {
      return { error: resultado.error, valores }
    }

    onActualizar(entrega.id, { ...actualizacionLocal, estado_local: resultado.encolado ? 'pendiente_sincronizar' : 'sincronizada' })
    return undefined
  }
}
