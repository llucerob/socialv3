'use client'

import { useActionState } from 'react'
import { rechazarSolicitud, type DecisionFormState } from '@/lib/decisiones/actions'
import { Button } from '@/components/ui/Button'

export function RechazarForm({ solicitudId }: { solicitudId: string }) {
  const accion = rechazarSolicitud.bind(null, solicitudId)
  const [state, formAction, pending] = useActionState<DecisionFormState, FormData>(
    accion,
    undefined
  )

  return (
    <form action={formAction} className="max-w-md space-y-2">
      <label htmlFor="comentario-rechazo" className="text-sm font-medium text-text-primary">
        Motivo de rechazo *
      </label>
      <textarea
        id="comentario-rechazo"
        name="comentario"
        required
        rows={2}
        defaultValue={state?.valores?.comentario}
        className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary"
      />
      {state?.error && (
        <p role="alert" className="text-sm text-danger-fg">
          {state.error}
        </p>
      )}
      <Button type="submit" variante="danger" disabled={pending}>
        {pending ? 'Guardando…' : 'Rechazar solicitud'}
      </Button>
    </form>
  )
}
