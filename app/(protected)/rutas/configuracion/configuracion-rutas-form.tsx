'use client'

import { useActionState } from 'react'
import type { ConfiguracionRutasFormState } from '@/lib/rutas/actions'
import type { ConfiguracionRutas } from '@/lib/rutas/types'

type ConfiguracionRutasFormAction = (
  state: ConfiguracionRutasFormState,
  formData: FormData
) => Promise<ConfiguracionRutasFormState>

export function ConfiguracionRutasForm({
  action,
  defaultValues,
}: {
  action: ConfiguracionRutasFormAction
  defaultValues: ConfiguracionRutas
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div className="space-y-1">
        <label htmlFor="origen_nombre" className="text-sm font-medium">
          Nombre del punto de origen *
        </label>
        <input
          id="origen_nombre"
          name="origen_nombre"
          required
          defaultValue={defaultValues.origen_nombre}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="origen_latitud" className="text-sm font-medium">
            Latitud *
          </label>
          <input
            id="origen_latitud"
            name="origen_latitud"
            type="number"
            step="any"
            min={-90}
            max={90}
            required
            defaultValue={defaultValues.origen_latitud}
            className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="origen_longitud" className="text-sm font-medium">
            Longitud *
          </label>
          <input
            id="origen_longitud"
            name="origen_longitud"
            type="number"
            step="any"
            min={-180}
            max={180}
            required
            defaultValue={defaultValues.origen_longitud}
            className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
          />
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
        {pending ? 'Guardando…' : 'Guardar configuración'}
      </button>
    </form>
  )
}
