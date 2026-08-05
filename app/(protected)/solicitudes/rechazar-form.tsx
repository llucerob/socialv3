'use client'

import { useActionState } from 'react'
import { rechazarSolicitud, type DecisionFormState } from '@/lib/decisiones/actions'

export function RechazarForm({ solicitudId }: { solicitudId: string }) {
  const accion = rechazarSolicitud.bind(null, solicitudId)
  const [state, formAction, pending] = useActionState<DecisionFormState, FormData>(
    accion,
    undefined
  )

  return (
    <form action={formAction} className="max-w-md space-y-2">
      <label htmlFor="comentario-rechazo" className="text-sm font-medium">
        Motivo de rechazo *
      </label>
      <textarea
        id="comentario-rechazo"
        name="comentario"
        required
        rows={2}
        defaultValue={state?.valores?.comentario}
        className="w-full rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
      />
      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-red-600/30 px-4 py-2 text-sm font-medium text-red-600 disabled:opacity-50"
      >
        {pending ? 'Guardando…' : 'Rechazar solicitud'}
      </button>
    </form>
  )
}
