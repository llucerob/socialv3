'use client'

import { useActionState } from 'react'
import type { FallidaFormState } from '@/lib/entregas/actions'
import type { MotivoEntregaFallida } from '@/lib/motivos-entrega/types'
import { Button } from '@/components/ui/Button'

type FallidaFormAction = (
  state: FallidaFormState,
  formData: FormData
) => Promise<FallidaFormState>

// US-19.03: "la vista de terreno usa estos motivos" — antes un <select>
// codificado a partir de MOTIVOS_FALLO (enum fijo), ahora recibe el catálogo
// de motivos activos como prop (el llamador, mis-entregas/[id]/page.tsx, es
// quien lo consulta server-side).
export function EntregaFallidaForm({
  action,
  motivos,
}: {
  action: FallidaFormAction
  motivos: MotivoEntregaFallida[]
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const valores = state?.valores

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="motivo_fallo" className="text-sm font-medium text-text-primary">
          Motivo *
        </label>
        <select
          id="motivo_fallo"
          name="motivo_fallo"
          required
          defaultValue={valores?.motivo_fallo ?? ''}
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-base text-text-primary"
        >
          <option value="" disabled>
            Selecciona…
          </option>
          {motivos.map((motivo) => (
            <option key={motivo.id} value={motivo.id}>
              {motivo.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="observacion" className="text-sm font-medium text-text-primary">
          Observación
        </label>
        <textarea
          id="observacion"
          name="observacion"
          rows={2}
          defaultValue={valores?.observacion}
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-base text-text-primary"
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-danger-fg">
          {state.error}
        </p>
      )}

      <Button type="submit" variante="danger" disabled={pending} className="w-full py-3 text-base">
        {pending ? 'Guardando…' : 'Marcar como fallida'}
      </Button>
    </form>
  )
}
