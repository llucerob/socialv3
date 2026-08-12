'use client'

import { useActionState } from 'react'
import type { ConfiguracionRutasFormState } from '@/lib/rutas/actions'
import type { ConfiguracionRutas } from '@/lib/rutas/types'
import { Button } from '@/components/ui/Button'

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
  const claseCampo = 'w-full rounded-lg border border-border bg-transparent px-3 py-2 text-text-primary'

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div className="space-y-1">
        <label htmlFor="origen_nombre" className="text-sm font-medium text-text-primary">
          Nombre del punto de origen *
        </label>
        <input
          id="origen_nombre"
          name="origen_nombre"
          required
          defaultValue={defaultValues.origen_nombre}
          className={claseCampo}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="origen_latitud" className="text-sm font-medium text-text-primary">
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
            className={claseCampo}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="origen_longitud" className="text-sm font-medium text-text-primary">
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
            className={claseCampo}
          />
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-danger-fg">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : 'Guardar configuración'}
      </Button>
    </form>
  )
}
