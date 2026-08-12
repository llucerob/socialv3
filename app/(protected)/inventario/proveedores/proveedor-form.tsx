'use client'

import { useActionState } from 'react'
import type { ProveedorFormState } from '@/lib/proveedores/actions'
import type { Proveedor } from '@/lib/proveedores/types'
import { Button } from '@/components/ui/Button'

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
  const claseCampo = 'w-full rounded-lg border border-border bg-transparent px-3 py-2 text-text-primary'

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-1">
        <label htmlFor="nombre" className="text-sm font-medium text-text-primary">
          Nombre *
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          defaultValue={valores?.nombre ?? defaultValues?.nombre}
          className={claseCampo}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="rut" className="text-sm font-medium text-text-primary">
          RUT *
        </label>
        <input
          id="rut"
          name="rut"
          required
          placeholder="76.123.456-7"
          defaultValue={valores?.rut ?? defaultValues?.rut}
          className={claseCampo}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="contacto" className="text-sm font-medium text-text-primary">
          Contacto
        </label>
        <input
          id="contacto"
          name="contacto"
          placeholder="Nombre, teléfono o correo de contacto"
          defaultValue={valores?.contacto ?? defaultValues?.contacto ?? ''}
          className={claseCampo}
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-danger-fg">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : submitLabel}
      </Button>
    </form>
  )
}
