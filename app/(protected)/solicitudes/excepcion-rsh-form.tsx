'use client'

import { useActionState } from 'react'
import { aprobarExcepcionRsh, type ExcepcionRshFormState } from '@/lib/decisiones/actions'

// US-05.05: "autorizar excepcionalmente... sin ocultar que se trata de un
// caso excepcional" — "se exige motivo escrito" y "autoridad o unidad que
// la solicita" (ambos obligatorios, a diferencia del comentario opcional de
// AprobarForm) · "la excepción no puede aprobarse sin informe social
// asociado" (EPIC 23, validado en el servidor). A diferencia de
// ExcepcionDialisisForm (solo reembolso), una excepción RSH puede aplicar a
// cualquier tipo de ayuda, así que muestra monto o cantidad según
// corresponda, igual que AprobarForm.
export function ExcepcionRshForm({ solicitudId, esReembolso }: { solicitudId: string; esReembolso: boolean }) {
  const accion = aprobarExcepcionRsh.bind(null, solicitudId)
  const [state, formAction, pending] = useActionState<ExcepcionRshFormState, FormData>(accion, undefined)
  const valores = state?.valores

  return (
    <form action={formAction} className="max-w-md space-y-3 rounded border border-amber-600/30 bg-amber-600/10 p-4">
      <p className="text-sm font-medium text-amber-700 dark:text-amber-500">
        Aprobar por excepción (hogar supera el 40% RSH)
      </p>

      {esReembolso ? (
        <div className="space-y-1">
          <label htmlFor="monto_aprobado_excepcion_rsh" className="text-sm font-medium">
            Monto aprobado *
          </label>
          <input
            id="monto_aprobado_excepcion_rsh"
            name="monto_aprobado"
            type="number"
            min={0}
            step="1"
            required
            defaultValue={valores?.monto_aprobado}
            className="w-full rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
        </div>
      ) : (
        <div className="space-y-1">
          <label htmlFor="cantidad_aprobada_excepcion_rsh" className="text-sm font-medium">
            Cantidad o detalle aprobado *
          </label>
          <input
            id="cantidad_aprobada_excepcion_rsh"
            name="cantidad_aprobada"
            required
            placeholder="ej. 2 cajas de mercadería"
            defaultValue={valores?.cantidad_aprobada}
            className="w-full rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="autoridad_solicitante" className="text-sm font-medium">
          Autoridad o unidad que solicita la excepción *
        </label>
        <input
          id="autoridad_solicitante"
          name="autoridad_solicitante"
          required
          placeholder="ej. Alcaldía"
          defaultValue={valores?.autoridad_solicitante}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="motivo_excepcion_rsh" className="text-sm font-medium">
          Motivo de la excepción *
        </label>
        <textarea
          id="motivo_excepcion_rsh"
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
