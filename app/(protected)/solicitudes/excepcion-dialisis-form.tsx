'use client'

import { useActionState } from 'react'
import { aprobarExcepcionDialisis, type ExcepcionDialisisFormState } from '@/lib/decisiones/actions'

// US-15.05: "autorizar excepcionalmente un monto superior al tope" —
// "se exige motivo escrito" (a diferencia del comentario opcional de
// AprobarForm, aquí es obligatorio) · "se registra usuario, fecha y
// fundamento" (decisiones_solicitud, sin trabajo adicional) · la solicitud
// queda en estado "aprobada_excepcion", visible sin ocultarse en el resto
// de la UI.
export function ExcepcionDialisisForm({ solicitudId }: { solicitudId: string }) {
  const accion = aprobarExcepcionDialisis.bind(null, solicitudId)
  const [state, formAction, pending] = useActionState<ExcepcionDialisisFormState, FormData>(
    accion,
    undefined
  )
  const valores = state?.valores

  return (
    <form action={formAction} className="max-w-md space-y-3 rounded border border-amber-600/30 bg-amber-600/10 p-4">
      <p className="text-sm font-medium text-amber-700 dark:text-amber-500">
        Aprobar por excepción (supera el tope mensual de diálisis)
      </p>

      <div className="space-y-1">
        <label htmlFor="monto_aprobado_excepcion" className="text-sm font-medium">
          Monto aprobado *
        </label>
        <input
          id="monto_aprobado_excepcion"
          name="monto_aprobado"
          type="number"
          min={0}
          step="1"
          required
          defaultValue={valores?.monto_aprobado}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="motivo_excepcion" className="text-sm font-medium">
          Motivo de la excepción *
        </label>
        <textarea
          id="motivo_excepcion"
          name="motivo"
          required
          rows={2}
          defaultValue={valores?.motivo}
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
        className="rounded border border-amber-600/30 px-4 py-2 text-sm font-medium text-amber-700 disabled:opacity-50 dark:text-amber-500"
      >
        {pending ? 'Guardando…' : 'Aprobar por excepción'}
      </button>
    </form>
  )
}
