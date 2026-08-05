'use client'

import { useActionState } from 'react'
import type { ProveedorFormState } from '@/lib/proveedores/actions'
import type { Proveedor } from '@/lib/proveedores/types'

type ProveedorFormAction = (state: ProveedorFormState, formData: FormData) => Promise<ProveedorFormState>

export function ProveedorForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: ProveedorFormAction
  defaultValues?: Partial<Proveedor>
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const valores = state?.valores

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-1">
        <label htmlFor="nombre" className="text-sm font-medium">
          Nombre *
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          defaultValue={valores?.nombre ?? defaultValues?.nombre}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="rut" className="text-sm font-medium">
          RUT *
        </label>
        <input
          id="rut"
          name="rut"
          required
          placeholder="76.123.456-7"
          defaultValue={valores?.rut ?? defaultValues?.rut}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="contacto" className="text-sm font-medium">
          Contacto
        </label>
        <input
          id="contacto"
          name="contacto"
          placeholder="Nombre, teléfono o correo de contacto"
          defaultValue={valores?.contacto ?? defaultValues?.contacto ?? ''}
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
