'use client'

import { useActionState } from 'react'
import type { PagoReembolsoFormState } from '@/lib/reembolsos/actions'

type RegistrarPagoFormAction = (
  state: PagoReembolsoFormState,
  formData: FormData
) => Promise<PagoReembolsoFormState>

export function RegistrarPagoForm({ action }: { action: RegistrarPagoFormAction }) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const valores = state?.valores

  return (
    <form action={formAction} className="max-w-md space-y-3">
      <div className="space-y-1">
        <label htmlFor="fecha_pago" className="text-sm font-medium">
          Fecha de pago *
        </label>
        <input
          id="fecha_pago"
          name="fecha_pago"
          type="date"
          required
          defaultValue={valores?.fecha_pago ?? new Date().toISOString().slice(0, 10)}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="monto_pagado" className="text-sm font-medium">
          Monto pagado *
        </label>
        <input
          id="monto_pagado"
          name="monto_pagado"
          type="number"
          min={0}
          step="1"
          required
          defaultValue={valores?.monto_pagado}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="medio_pago" className="text-sm font-medium">
          Medio de pago *
        </label>
        <input
          id="medio_pago"
          name="medio_pago"
          required
          placeholder="transferencia, efectivo, cheque…"
          defaultValue={valores?.medio_pago}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="observacion" className="text-sm font-medium">
          Observación
        </label>
        <textarea
          id="observacion"
          name="observacion"
          rows={2}
          defaultValue={valores?.observacion}
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
        className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Guardando…' : 'Registrar pago'}
      </button>
    </form>
  )
}
