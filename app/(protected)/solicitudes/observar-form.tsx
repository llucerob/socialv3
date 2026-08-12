'use client'

import { useActionState } from 'react'
import { observarSolicitud, type ObservarSolicitudState } from '@/lib/solicitudes/actions'
import { Button } from '@/components/ui/Button'

export function ObservarForm({ solicitudId }: { solicitudId: string }) {
  const accion = observarSolicitud.bind(null, solicitudId)
  const [state, formAction, pending] = useActionState<ObservarSolicitudState, FormData>(
    accion,
    undefined
  )

  return (
    <form action={formAction} className="max-w-md space-y-2">
      <label htmlFor="motivo" className="text-sm font-medium text-text-primary">
        Motivo de observación *
      </label>
      <textarea
        id="motivo"
        name="motivo"
        required
        rows={2}
        defaultValue={state?.motivo}
        placeholder="Antecedentes adicionales que se necesitan…"
        className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary"
      />
      {state?.error && (
        <p role="alert" className="text-sm text-danger-fg">
          {state.error}
        </p>
      )}
      <Button type="submit" variante="secondary" disabled={pending}>
        {pending ? 'Guardando…' : 'Observar solicitud'}
      </Button>
    </form>
  )
}
