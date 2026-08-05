'use client'

import { useActionState } from 'react'
import { observarSolicitud, type ObservarSolicitudState } from '@/lib/solicitudes/actions'

export function ObservarForm({ solicitudId }: { solicitudId: string }) {
  const accion = observarSolicitud.bind(null, solicitudId)
  const [state, formAction, pending] = useActionState<ObservarSolicitudState, FormData>(
    accion,
    undefined
  )

  return (
    <form action={formAction} className="max-w-md space-y-2">
      <label htmlFor="motivo" className="text-sm font-medium">
        Motivo de observación *
      </label>
      <textarea
        id="motivo"
        name="motivo"
        required
        rows={2}
        defaultValue={state?.motivo}
        placeholder="Antecedentes adicionales que se necesitan…"
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
        className="rounded border border-black/10 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-white/20"
      >
        {pending ? 'Guardando…' : 'Observar solicitud'}
      </button>
    </form>
  )
}
