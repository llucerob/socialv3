'use client'

import { useActionState } from 'react'
import type { SectorFormState } from '@/lib/sectores/actions'
import type { Sector } from '@/lib/sectores/types'
import { Button } from '@/components/ui/Button'

type SectorFormAction = (state: SectorFormState, formData: FormData) => Promise<SectorFormState>

export function SectorForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: SectorFormAction
  defaultValues?: Partial<Sector>
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const valores = state?.valores

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
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-text-primary"
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
