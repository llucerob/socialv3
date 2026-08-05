'use client'

import { useActionState } from 'react'
import type { GrupoFamiliarFormState } from '@/lib/hogares/actions'
import type { GrupoFamiliar } from '@/lib/hogares/types'
import type { Sector } from '@/lib/sectores/types'

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

  return (
    <form action={formAction} className="max-w-lg space-y-4">
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
            defaultValue={
              (Number.isNaN(valores?.latitud) ? '' : valores?.latitud) ??
              defaultValues?.latitud ??
              ''
            }
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
            defaultValue={
              (Number.isNaN(valores?.longitud) ? '' : valores?.longitud) ??
              defaultValues?.longitud ??
              ''
            }
            className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </div>
      </div>
      <p className="-mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Opcional. Se puede completar después — un hogar sin coordenadas sigue
        operando con normalidad.
      </p>

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
