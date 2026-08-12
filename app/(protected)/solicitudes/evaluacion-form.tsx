'use client'

import { useActionState } from 'react'
import { registrarEvaluacion, type EvaluacionFormState } from '@/lib/evaluaciones/actions'
import { Button } from '@/components/ui/Button'

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
        <label htmlFor="fundamento" className="text-sm font-medium text-text-primary">
          Fundamento *
        </label>
        <textarea
          id="fundamento"
          name="fundamento"
          required
          rows={4}
          defaultValue={valores?.fundamento}
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-text-primary"
        />
      </div>

      <fieldset className="space-y-1">
        <legend className="text-sm font-medium text-text-primary">Recomendación *</legend>
        <label className="mr-4 inline-flex items-center gap-1 text-sm text-text-primary">
          <input
            type="radio"
            name="recomendacion"
            value="aprobar"
            required
            defaultChecked={valores?.recomendacion === 'aprobar'}
          />
          Aprobar
        </label>
        <label className="inline-flex items-center gap-1 text-sm text-text-primary">
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
        <p role="alert" className="text-sm text-danger-fg">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : 'Registrar evaluación'}
      </Button>
    </form>
  )
}
