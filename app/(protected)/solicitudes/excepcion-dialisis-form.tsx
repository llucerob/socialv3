'use client'

import { useActionState } from 'react'
import { aprobarExcepcionDialisis, type ExcepcionDialisisFormState } from '@/lib/decisiones/actions'
import { Button } from '@/components/ui/Button'
import { BadgeExcepcion, CardExcepcion } from '@/components/ui/ExcepcionRSH'

// US-15.05: "autorizar excepcionalmente un monto superior al tope" —
// "se exige motivo escrito" (a diferencia del comentario opcional de
// AprobarForm, aquí es obligatorio) · "se registra usuario, fecha y
// fundamento" (decisiones_solicitud, sin trabajo adicional) · la solicitud
// queda en estado "aprobada_excepcion", visible sin ocultarse en el resto
// de la UI — mismo tratamiento visual (CardExcepcion/BadgeExcepcion) que la
// excepción RSH, aunque el motivo de excepción sea distinto.
export function ExcepcionDialisisForm({ solicitudId }: { solicitudId: string }) {
  const accion = aprobarExcepcionDialisis.bind(null, solicitudId)
  const [state, formAction, pending] = useActionState<ExcepcionDialisisFormState, FormData>(
    accion,
    undefined
  )
  const valores = state?.valores

  return (
    <CardExcepcion>
      <form action={formAction} className="max-w-md space-y-3">
        <BadgeExcepcion texto="Aprobar por excepción — supera el tope mensual de diálisis" />

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
            className="w-full rounded-lg border border-exception-border bg-transparent px-3 py-2 text-sm"
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
            className="w-full rounded-lg border border-exception-border bg-transparent px-3 py-2 text-sm"
          />
        </div>

        {state?.error && (
          <p role="alert" className="text-sm text-danger-fg">
            {state.error}
          </p>
        )}

        <Button type="submit" variante="secondary" disabled={pending} className="border-exception-border text-exception-fg hover:bg-exception-bg">
          {pending ? 'Guardando…' : 'Aprobar por excepción'}
        </Button>
      </form>
    </CardExcepcion>
  )
}
