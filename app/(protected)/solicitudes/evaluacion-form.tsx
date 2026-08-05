'use client'

import { useActionState } from 'react'
import { registrarEvaluacion, type EvaluacionFormState } from '@/lib/evaluaciones/actions'

export function EvaluacionForm({ solicitudId }: { solicitudId: string }) {
  const accion = registrarEvaluacion.bind(null, solicitudId)
  const [state, formAction, pending] = useActionState<EvaluacionFormState, FormData>(
    accion,
    undefined
  )
  const valores = state?.valores

  return (
    <form action={formAction} className="max-w-lg space-y-3">
      <div className="space-y-1">
        <label htmlFor="fundamento" className="text-sm font-medium">
          Fundamento *
        </label>
        <textarea
          id="fundamento"
          name="fundamento"
          required
          rows={4}
          defaultValue={valores?.fundamento}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </div>

      <fieldset className="space-y-1">
        <legend className="text-sm font-medium">Recomendación *</legend>
        <label className="mr-4 inline-flex items-center gap-1 text-sm">
          <input
            type="radio"
            name="recomendacion"
            value="aprobar"
            required
            defaultChecked={valores?.recomendacion === 'aprobar'}
          />
          Aprobar
        </label>
        <label className="inline-flex items-center gap-1 text-sm">
          <input
            type="radio"
            name="recomendacion"
            value="rechazar"
            defaultChecked={valores?.recomendacion === 'rechazar'}
          />
          Rechazar
        </label>
      </fieldset>

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
        {pending ? 'Guardando…' : 'Registrar evaluación'}
      </button>
    </form>
  )
}
