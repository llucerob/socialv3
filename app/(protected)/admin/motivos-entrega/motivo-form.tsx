'use client'

import { useActionState } from 'react'
import type { MotivoFormState } from '@/lib/motivos-entrega/actions'
import type { MotivoEntregaFallida } from '@/lib/motivos-entrega/types'

type MotivoFormAction = (state: MotivoFormState, formData: FormData) => Promise<MotivoFormState>

export function MotivoForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: MotivoFormAction
  defaultValues?: Partial<MotivoEntregaFallida>
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
