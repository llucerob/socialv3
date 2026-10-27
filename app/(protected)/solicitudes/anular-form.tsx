'use client'

import { useActionState, useState } from 'react'
import { anularSolicitud, type AnularSolicitudState } from '@/lib/solicitudes/actions'
import { Button } from '@/components/ui/Button'

// Anular es irreversible: en vez de un confirm() del navegador, el primer
// clic despliega el motivo (obligatorio) y un botón explícito de
// confirmación. Mismo estilo de formulario que ObservarForm.
export function AnularForm({ solicitudId }: { solicitudId: string }) {
  const accion = anularSolicitud.bind(null, solicitudId)
  const [state, formAction, pending] = useActionState<AnularSolicitudState, FormData>(
    accion,
    undefined
  )
  const [abierto, setAbierto] = useState(false)

  if (!abierto && !state?.error) {
    return (
      <Button type="button" variante="danger" onClick={() => setAbierto(true)}>
        Anular solicitud
      </Button>
    )
  }

  return (
    <form action={formAction} className="max-w-md space-y-2">
      <label htmlFor="motivo_anulacion" className="text-sm font-medium text-text-primary">
        Motivo de anulación *
      </label>
      <textarea
        id="motivo_anulacion"
        name="motivo"
        required
        rows={2}
        defaultValue={state?.motivo}
        placeholder="Por qué se anula esta solicitud…"
        className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary"
      />
      <p className="text-xs text-text-muted">La anulación no se puede deshacer.</p>
      {state?.error && (
        <p role="alert" className="text-sm text-danger-fg">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" variante="danger" disabled={pending}>
          {pending ? 'Anulando…' : 'Confirmar anulación'}
        </Button>
        <Button type="button" variante="ghost" disabled={pending} onClick={() => setAbierto(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
