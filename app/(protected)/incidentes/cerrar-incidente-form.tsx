'use client'

import { useActionState } from 'react'
import { cerrarIncidente, type CerrarIncidenteState } from '@/lib/incidentes/actions'

// US-26.03: "se puede cambiar el estado a 'cerrado' solo si existen medidas
// correctivas registradas" — el propio formulario exige (y permite
// confirmar/editar) las medidas correctivas antes de cerrar.
export function CerrarIncidenteForm({
  incidenteId,
  medidasCorrectivas,
}: {
  incidenteId: string
  medidasCorrectivas: string | null
}) {
  const accion = cerrarIncidente.bind(null, incidenteId)
  const [state, formAction, pending] = useActionState<CerrarIncidenteState, FormData>(accion, undefined)

  return (
    <form action={formAction} className="max-w-md space-y-3">
      <div className="space-y-1">
        <label htmlFor="medidas_correctivas" className="text-sm font-medium">
          Medidas correctivas *
        </label>
        <textarea
          id="medidas_correctivas"
          name="medidas_correctivas"
          required
          rows={3}
          defaultValue={state?.medidas_correctivas ?? medidasCorrectivas ?? ''}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
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
        className="rounded border border-black/10 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-white/20"
      >
        {pending ? 'Cerrando…' : 'Cerrar incidente'}
      </button>
    </form>
  )
}
