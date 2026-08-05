'use client'

import { useActionState } from 'react'
import type { PersonaFormState } from '@/lib/personas/actions'
import type { Persona } from '@/lib/personas/types'

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

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-1">
        <label htmlFor="rut" className="text-sm font-medium">
          RUT *
        </label>
        <input
          id="rut"
          name="rut"
          required
          placeholder="12345678-9"
          defaultValue={valores?.rut ?? defaultValues?.rut}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="nombres" className="text-sm font-medium">
            Nombres *
          </label>
          <input
            id="nombres"
            name="nombres"
            required
            defaultValue={valores?.nombres ?? defaultValues?.nombres}
            className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="apellidos" className="text-sm font-medium">
            Apellidos *
          </label>
          <input
            id="apellidos"
            name="apellidos"
            required
            defaultValue={valores?.apellidos ?? defaultValues?.apellidos}
            className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="fecha_nacimiento" className="text-sm font-medium">
            Fecha de nacimiento *
          </label>
          <input
            id="fecha_nacimiento"
            name="fecha_nacimiento"
            type="date"
            required
            defaultValue={valores?.fecha_nacimiento ?? defaultValues?.fecha_nacimiento}
            className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="parentesco" className="text-sm font-medium">
            Parentesco *
          </label>
          <input
            id="parentesco"
            name="parentesco"
            required
            placeholder="Jefe de hogar, cónyuge, hijo/a…"
            defaultValue={valores?.parentesco ?? defaultValues?.parentesco}
            className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      {state?.warning && (
        <p role="alert" className="text-sm text-amber-600">
          {state.warning}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          name="confirmar_duplicado"
          value=""
          disabled={pending}
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {pending ? 'Guardando…' : submitLabel}
        </button>

        {permiteConfirmarDuplicado && state?.warning && (
          <button
            type="submit"
            name="confirmar_duplicado"
            value="true"
            disabled={pending}
            className="rounded border border-amber-600 px-4 py-2 text-sm font-medium text-amber-600 disabled:opacity-50"
          >
            Crear de todas formas
          </button>
        )}
      </div>
    </form>
  )
}
