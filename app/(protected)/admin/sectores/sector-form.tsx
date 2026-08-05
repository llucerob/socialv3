'use client'

import { useActionState } from 'react'
import type { SectorFormState } from '@/lib/sectores/actions'
import type { Sector } from '@/lib/sectores/types'

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
