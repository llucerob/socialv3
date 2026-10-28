'use client'

import { useActionState } from 'react'
import type { EntregaLocalFormState } from '@/lib/entregas/actions'
import { Button } from '@/components/ui/Button'

type EntregaLocalAction = (state: EntregaLocalFormState, formData: FormData) => Promise<EntregaLocalFormState>

// MR-06: entrega en local, registrada en el momento por quien atiende en el
// Departamento Social. Mismos datos de recepción que la entrega a domicilio
// (US-12.04), sin ubicación: se entrega en la oficina.
export function EntregaLocalForm({
  action,
  requiereEvidencia,
  submitLabel = 'Marcar como entregada',
}: {
  action: EntregaLocalAction
  requiereEvidencia: boolean
  submitLabel?: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const valores = state?.valores
  const claseCampo = 'w-full rounded-lg border border-border bg-transparent px-3 py-2 text-text-primary'

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="tipo_documento" value="fotografia" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="local_receptor_nombre" className="text-sm font-medium text-text-primary">
            Nombre de quien recibe *
          </label>
          <input
            id="local_receptor_nombre"
            name="receptor_nombre"
            required
            defaultValue={valores?.receptor_nombre}
            className={claseCampo}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="local_receptor_relacion" className="text-sm font-medium text-text-primary">
            Relación con el beneficiario
          </label>
          <input
            id="local_receptor_relacion"
            name="receptor_relacion"
            placeholder="el mismo beneficiario, hija, vecino…"
            defaultValue={valores?.receptor_relacion}
            className={claseCampo}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="local_fecha_hora" className="text-sm font-medium text-text-primary">
            Fecha y hora
          </label>
          <input
            id="local_fecha_hora"
            name="fecha_hora"
            type="datetime-local"
            defaultValue={valores?.fecha_hora}
            className={claseCampo}
          />
          <p className="text-xs text-text-muted">Si la dejas vacía, se usa el momento actual.</p>
        </div>
        <div className="space-y-1">
          <label htmlFor="local_archivo" className="text-sm font-medium text-text-primary">
            Evidencia fotográfica{requiereEvidencia ? ' *' : ''}
          </label>
          <input
            id="local_archivo"
            name="archivo"
            type="file"
            accept="image/*"
            required={requiereEvidencia}
            className="w-full text-sm text-text-primary file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="local_observacion" className="text-sm font-medium text-text-primary">
          Observación
        </label>
        <textarea
          id="local_observacion"
          name="observacion"
          rows={2}
          defaultValue={valores?.observacion}
          className={claseCampo}
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-danger-fg">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Registrando…' : submitLabel}
      </Button>
    </form>
  )
}
