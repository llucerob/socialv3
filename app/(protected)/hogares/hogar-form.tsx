'use client'

import { useActionState, useState } from 'react'
import dynamic from 'next/dynamic'
import type { GrupoFamiliarFormState } from '@/lib/hogares/actions'
import type { GrupoFamiliar } from '@/lib/hogares/types'
import type { Sector } from '@/lib/sectores/types'

// US-03.06: Leaflet depende del DOM del navegador (window/document) — no
// puede renderizarse en el servidor.
const SelectorCoordenadas = dynamic(
  () => import('@/components/mapa/SelectorCoordenadas').then((m) => m.SelectorCoordenadas),
  { ssr: false, loading: () => <div style={{ height: ALTO_MAPA }} className="w-full rounded border border-black/10 bg-black/5 dark:border-white/20 dark:bg-white/5" /> }
)

// MR-01: el mapa ocupa casi todo el alto visible para marcar el domicilio con
// precisión; en móvil no baja de 420px.
const ALTO_MAPA = 'clamp(420px, 70vh, 760px)'

type HogarFormAction = (
  state: GrupoFamiliarFormState,
  formData: FormData
) => Promise<GrupoFamiliarFormState>

export function HogarForm({
  action,
  defaultValues,
  submitLabel,
  sectores,
}: {
  action: HogarFormAction
  defaultValues?: Partial<GrupoFamiliar>
  submitLabel: string
  sectores: Sector[]
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  // Ver nota equivalente en persona-form.tsx: el servidor puede remontar
  // este formulario tras un error (ej. refresco de cookie de sesión), lo que
  // borraría lo tipeado. Los valores enviados vuelven en el state y tienen
  // prioridad sobre defaultValues.
  const valores = state?.valores

  // US-03.06: controlados (a diferencia del resto del formulario) para que
  // el mapa y los campos numéricos se mantengan sincronizados en ambas
  // direcciones — tipear una coordenada mueve el marcador, y marcar/arrastrar
  // en el mapa actualiza los campos.
  const [latitud, setLatitud] = useState<string>(() => {
    const inicial = valores?.latitud ?? defaultValues?.latitud
    return inicial !== null && inicial !== undefined && !Number.isNaN(inicial) ? String(inicial) : ''
  })
  const [longitud, setLongitud] = useState<string>(() => {
    const inicial = valores?.longitud ?? defaultValues?.longitud
    return inicial !== null && inicial !== undefined && !Number.isNaN(inicial) ? String(inicial) : ''
  })
  const latitudNumerica = latitud === '' ? null : Number(latitud)
  const longitudNumerica = longitud === '' ? null : Number(longitud)

  return (
    <form action={formAction} className="space-y-6">
      {/* MR-01: dos columnas en pantallas anchas — datos a la izquierda, mapa
          a la derecha con la mayor parte del espacio. En móvil se apilan. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-8">
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="direccion" className="text-sm font-medium">
              Dirección *
            </label>
            <input
              id="direccion"
              name="direccion"
              required
              defaultValue={valores?.direccion ?? defaultValues?.direccion}
              className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="sector" className="text-sm font-medium">
              Sector *
            </label>
            <select
              id="sector"
              name="sector"
              required
              defaultValue={valores?.sector ?? defaultValues?.sector ?? ''}
              className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
            >
              <option value="" disabled>
                Selecciona…
              </option>
              {/* US-19.02: si el hogar ya tenía un sector que hoy no está en el
                  catálogo activo (desactivado después de asignarlo, o dato
                  anterior a esta historia), se agrega como opción extra para no
                  cambiarlo sin que el usuario lo decida explícitamente. */}
              {defaultValues?.sector && !sectores.some((s) => s.nombre === defaultValues.sector) && (
                <option value={defaultValues.sector}>{defaultValues.sector} (no está en el catálogo activo)</option>
              )}
              {sectores.map((sector) => (
                <option key={sector.id} value={sector.nombre}>
                  {sector.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="telefono" className="text-sm font-medium">
              Teléfono
            </label>
            <input
              id="telefono"
              name="telefono"
              defaultValue={valores?.telefono ?? defaultValues?.telefono ?? ''}
              className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="tramo_rsh" className="text-sm font-medium">
                Tramo RSH (%)
              </label>
              <input
                id="tramo_rsh"
                name="tramo_rsh"
                type="number"
                min={0}
                max={100}
                step="0.01"
                defaultValue={
                  (Number.isNaN(valores?.tramo_rsh) ? '' : valores?.tramo_rsh) ??
                  defaultValues?.tramo_rsh ??
                  ''
                }
                className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="fecha_actualizacion_rsh" className="text-sm font-medium">
                Fecha actualización RSH
              </label>
              <input
                id="fecha_actualizacion_rsh"
                name="fecha_actualizacion_rsh"
                type="date"
                defaultValue={valores?.fecha_actualizacion_rsh ?? defaultValues?.fecha_actualizacion_rsh ?? ''}
                className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="observaciones" className="text-sm font-medium">
              Observaciones
            </label>
            <textarea
              id="observaciones"
              name="observaciones"
              rows={3}
              defaultValue={valores?.observaciones ?? defaultValues?.observaciones ?? ''}
              className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <span className="text-sm font-medium">Ubicación en el mapa</span>
            <SelectorCoordenadas
              latitud={latitudNumerica}
              longitud={longitudNumerica}
              alto={ALTO_MAPA}
              onCambiar={(lat, lng) => {
                setLatitud(lat.toFixed(7))
                setLongitud(lng.toFixed(7))
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="latitud" className="text-sm font-medium">
                Latitud
              </label>
              <input
                id="latitud"
                name="latitud"
                type="number"
                min={-90}
                max={90}
                step="0.0000001"
                value={latitud}
                onChange={(e) => setLatitud(e.target.value)}
                className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="longitud" className="text-sm font-medium">
                Longitud
              </label>
              <input
                id="longitud"
                name="longitud"
                type="number"
                min={-180}
                max={180}
                step="0.0000001"
                value={longitud}
                onChange={(e) => setLongitud(e.target.value)}
                className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Opcional. Se puede completar después — un hogar sin coordenadas sigue
            operando con normalidad.
          </p>
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Guardando…' : submitLabel}
      </button>
    </form>
  )
}
