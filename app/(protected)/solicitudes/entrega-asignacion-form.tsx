'use client'

import { useActionState } from 'react'
import type { FuncionarioTerreno } from '@/lib/entregas/types'

type AsignacionFormState = { error?: string; valores: { fecha_programada: string; responsable_id: string } } | undefined

type AsignacionFormAction = (
  state: AsignacionFormState,
  formData: FormData
) => Promise<AsignacionFormState>

export function EntregaAsignacionForm({
  action,
  funcionarios,
  submitLabel,
  fechaRequerida,
}: {
  action: AsignacionFormAction
  funcionarios: FuncionarioTerreno[]
  submitLabel: string
  fechaRequerida?: boolean
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const valores = state?.valores

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label htmlFor="fecha_programada" className="text-sm font-medium">
          Fecha programada{fechaRequerida ? ' *' : ''}
        </label>
        <input
          id="fecha_programada"
          name="fecha_programada"
          type="date"
          required={fechaRequerida}
          defaultValue={valores?.fecha_programada}
          className="rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="responsable_id" className="text-sm font-medium">
          Responsable
        </label>
        <select
          id="responsable_id"
          name="responsable_id"
          defaultValue={valores?.responsable_id ?? ''}
          className="rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
        >
          <option value="">Sin asignar</option>
          {funcionarios.map((funcionario) => (
            <option key={funcionario.id} value={funcionario.id}>
              {funcionario.nombre}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Guardando…' : submitLabel}
      </button>

      {state?.error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  )
}
