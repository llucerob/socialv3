'use client'

import { useActionState } from 'react'
import type { HitoFormState } from '@/lib/hitos/actions'
import { TIPO_HITO_LABELS, type TipoHito } from '@/lib/hitos/types'
import type { Persona } from '@/lib/personas/types'

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

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="tipo" className="text-sm font-medium">
            Tipo de hito *
          </label>
          <select
            id="tipo"
            name="tipo"
            required
            defaultValue={valores?.tipo ?? ''}
            className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
          >
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
          <label htmlFor="fecha_hito" className="text-sm font-medium">
            Fecha del hito *
          </label>
          <input
            id="fecha_hito"
            name="fecha_hito"
            type="date"
            required
            defaultValue={valores?.fecha_hito ?? ''}
            className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="categoria" className="text-sm font-medium">
          Categoría *
        </label>
        <input
          id="categoria"
          name="categoria"
          required
          placeholder="Ej. cambio de composición familiar, hospitalización…"
          defaultValue={valores?.categoria ?? ''}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="persona_id" className="text-sm font-medium">
          Integrante asociado
        </label>
        <select
          id="persona_id"
          name="persona_id"
          defaultValue={valores?.persona_id ?? ''}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
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
        <label htmlFor="comentario" className="text-sm font-medium">
          Comentario *
        </label>
        <textarea
          id="comentario"
          name="comentario"
          required
          rows={4}
          defaultValue={valores?.comentario ?? ''}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
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
        {pending ? 'Guardando…' : 'Registrar hito'}
      </button>
    </form>
  )
}
