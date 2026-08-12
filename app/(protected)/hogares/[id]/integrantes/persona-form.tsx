'use client'

import { useActionState } from 'react'
import type { PersonaFormState } from '@/lib/personas/actions'
import type { Persona } from '@/lib/personas/types'
import { Button } from '@/components/ui/Button'

type PersonaFormAction = (
  state: PersonaFormState,
  formData: FormData
) => Promise<PersonaFormState>

export function PersonaForm({
  action,
  defaultValues,
  submitLabel,
  permiteConfirmarDuplicado = false,
}: {
  action: PersonaFormAction
  defaultValues?: Partial<Persona>
  submitLabel: string
  permiteConfirmarDuplicado?: boolean
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  // El servidor puede re-renderizar la página tras un error/warning (ej. si
  // se refresca la cookie de sesión durante la validación), lo que remonta
  // este formulario y borraría lo tipeado. Por eso los valores enviados se
  // devuelven en el state y tienen prioridad sobre defaultValues.
  const valores = state?.valores
  const claseCampo = 'w-full rounded-lg border border-border bg-transparent px-3 py-2 text-text-primary'

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-1">
        <label htmlFor="rut" className="text-sm font-medium text-text-primary">
          RUT *
        </label>
        <input
          id="rut"
          name="rut"
          required
          placeholder="12345678-9"
          defaultValue={valores?.rut ?? defaultValues?.rut}
          className={claseCampo}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="nombres" className="text-sm font-medium text-text-primary">
            Nombres *
          </label>
          <input
            id="nombres"
            name="nombres"
            required
            defaultValue={valores?.nombres ?? defaultValues?.nombres}
            className={claseCampo}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="apellidos" className="text-sm font-medium text-text-primary">
            Apellidos *
          </label>
          <input
            id="apellidos"
            name="apellidos"
            required
            defaultValue={valores?.apellidos ?? defaultValues?.apellidos}
            className={claseCampo}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="fecha_nacimiento" className="text-sm font-medium text-text-primary">
            Fecha de nacimiento *
          </label>
          <input
            id="fecha_nacimiento"
            name="fecha_nacimiento"
            type="date"
            required
            defaultValue={valores?.fecha_nacimiento ?? defaultValues?.fecha_nacimiento}
            className={claseCampo}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="parentesco" className="text-sm font-medium text-text-primary">
            Parentesco *
          </label>
          <input
            id="parentesco"
            name="parentesco"
            required
            placeholder="Jefe de hogar, cónyuge, hijo/a…"
            defaultValue={valores?.parentesco ?? defaultValues?.parentesco}
            className={claseCampo}
          />
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-danger-fg">
          {state.error}
        </p>
      )}

      {state?.warning && (
        <p role="alert" className="text-sm text-warning-fg">
          {state.warning}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" name="confirmar_duplicado" value="" disabled={pending}>
          {pending ? 'Guardando…' : submitLabel}
        </Button>

        {permiteConfirmarDuplicado && state?.warning && (
          <Button
            type="submit"
            name="confirmar_duplicado"
            value="true"
            variante="secondary"
            disabled={pending}
            className="border-warning-fg text-warning-fg hover:bg-warning-bg"
          >
            Crear de todas formas
          </Button>
        )}
      </div>
    </form>
  )
}
