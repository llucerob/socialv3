'use client'

import { useActionState, useState } from 'react'
import type { RealizadaFormState } from '@/lib/entregas/actions'

type RealizadaFormAction = (
  state: RealizadaFormState,
  formData: FormData
) => Promise<RealizadaFormState>

// US-12.07: "el sistema puede solicitar ubicación" · "se guarda solo si el
// usuario la autoriza" · "la entrega puede completarse sin ubicación". Por
// eso la ubicación NUNCA se pide automáticamente: solo al presionar este
// botón, que dispara el prompt de permiso del navegador.
function BotonUbicacion({
  onUbicacion,
}: {
  onUbicacion: (lat: number, lng: number) => void
}) {
  const [estado, setEstado] = useState<'inicial' | 'buscando' | 'lista' | 'error'>('inicial')

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => {
          if (!navigator.geolocation) {
            setEstado('error')
            return
          }
          setEstado('buscando')
          navigator.geolocation.getCurrentPosition(
            (posicion) => {
              onUbicacion(posicion.coords.latitude, posicion.coords.longitude)
              setEstado('lista')
            },
            () => setEstado('error'),
            { enableHighAccuracy: true, timeout: 10000 }
          )
        }}
        className="rounded border border-black/10 px-3 py-2 text-sm font-medium dark:border-white/20"
      >
        {estado === 'buscando' ? 'Obteniendo ubicación…' : 'Usar mi ubicación actual'}
      </button>
      {estado === 'lista' && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Ubicación capturada.</p>
      )}
      {estado === 'error' && (
        <p className="text-xs text-red-600">No se pudo obtener la ubicación (opcional, puedes continuar).</p>
      )}
    </div>
  )
}

export function EntregaRealizadaForm({
  action,
  requiereEvidencia,
}: {
  action: RealizadaFormAction
  requiereEvidencia: boolean
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const valores = state?.valores
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="tipo_documento" value="fotografia" />
      {ubicacion && (
        <>
          <input type="hidden" name="latitud" value={ubicacion.lat} />
          <input type="hidden" name="longitud" value={ubicacion.lng} />
        </>
      )}

      <div className="space-y-1">
        <label htmlFor="fecha_hora" className="text-sm font-medium">
          Fecha y hora
        </label>
        <input
          id="fecha_hora"
          name="fecha_hora"
          type="datetime-local"
          defaultValue={valores?.fecha_hora}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 text-base dark:border-white/20"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Si la dejas vacía, se usa el momento actual.</p>
      </div>

      <div className="space-y-1">
        <label htmlFor="receptor_nombre" className="text-sm font-medium">
          Nombre de quien recibe *
        </label>
        <input
          id="receptor_nombre"
          name="receptor_nombre"
          required
          defaultValue={valores?.receptor_nombre}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 text-base dark:border-white/20"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="receptor_relacion" className="text-sm font-medium">
          Relación con el beneficiario
        </label>
        <input
          id="receptor_relacion"
          name="receptor_relacion"
          placeholder="madre, hijo, el mismo beneficiario…"
          defaultValue={valores?.receptor_relacion}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 text-base dark:border-white/20"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="archivo" className="text-sm font-medium">
          Evidencia fotográfica{requiereEvidencia ? ' *' : ''}
        </label>
        <input
          id="archivo"
          name="archivo"
          type="file"
          accept="image/*"
          capture="environment"
          required={requiereEvidencia}
          className="w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-foreground file:px-3 file:py-2 file:text-sm file:font-medium file:text-background"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="observacion" className="text-sm font-medium">
          Observación
        </label>
        <textarea
          id="observacion"
          name="observacion"
          rows={2}
          defaultValue={valores?.observacion}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 text-base dark:border-white/20"
        />
      </div>

      <BotonUbicacion onUbicacion={(lat, lng) => setUbicacion({ lat, lng })} />

      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-foreground px-4 py-3 text-base font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Guardando…' : 'Marcar como realizada'}
      </button>
    </form>
  )
}
