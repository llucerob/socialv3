'use client'

import { useActionState } from 'react'
import type { HitoFormState } from '@/lib/hitos/actions'
import { TIPO_HITO_LABELS, type TipoHito } from '@/lib/hitos/types'
import type { Persona } from '@/lib/personas/types'
import { Button } from '@/components/ui/Button'

type HitoFormAction = (state: HitoFormState, formData: FormData) => Promise<HitoFormState>

const TIPOS: TipoHito[] = ['familiar', 'social', 'salud']

export function HitoForm({
  action,
  integrantes,
}: {
  action: HitoFormAction
  integrantes: Persona[]
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const valores = state?.valores
  const claseCampo = 'w-full rounded-lg border border-border bg-transparent px-3 py-2 text-text-primary'

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="tipo" className="text-sm font-medium text-text-primary">
            Tipo de hito *
          </label>
          <select id="tipo" name="tipo" required defaultValue={valores?.tipo ?? ''} className={claseCampo}>
            <option value="" disabled>
              Selecciona un tipo…
            </option>
            {TIPOS.map((tipo) => (
              <option key={tipo} value={tipo}>
                {TIPO_HITO_LABELS[tipo]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="fecha_hito" className="text-sm font-medium text-text-primary">
            Fecha del hito *
          </label>
          <input
            id="fecha_hito"
            name="fecha_hito"
            type="date"
            required
            defaultValue={valores?.fecha_hito ?? ''}
            className={claseCampo}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="categoria" className="text-sm font-medium text-text-primary">
          Categoría *
        </label>
        <input
          id="categoria"
          name="categoria"
          required
          placeholder="Ej. cambio de composición familiar, hospitalización…"
          defaultValue={valores?.categoria ?? ''}
          className={claseCampo}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="persona_id" className="text-sm font-medium text-text-primary">
          Integrante asociado
        </label>
        <select
          id="persona_id"
          name="persona_id"
          defaultValue={valores?.persona_id ?? ''}
          className={claseCampo}
        >
          <option value="">Ninguno (hito del hogar en general)</option>
          {integrantes.map((persona) => (
            <option key={persona.id} value={persona.id}>
              {persona.nombres} {persona.apellidos}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="comentario" className="text-sm font-medium text-text-primary">
          Comentario *
        </label>
        <textarea
          id="comentario"
          name="comentario"
          required
          rows={4}
          defaultValue={valores?.comentario ?? ''}
          className={claseCampo}
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-danger-fg">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : 'Registrar hito'}
      </Button>
    </form>
  )
}
