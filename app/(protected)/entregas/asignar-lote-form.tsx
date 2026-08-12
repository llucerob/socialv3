'use client'

import { useActionState } from 'react'
import type { AsignacionLoteFormState } from '@/lib/rutas/actions'
import type { FuncionarioTerreno } from '@/lib/entregas/types'
import { Button } from '@/components/ui/Button'

type AsignarLoteFormAction = (
  state: AsignacionLoteFormState,
  formData: FormData
) => Promise<AsignacionLoteFormState>

// US-13.01: "se puede seleccionar múltiples entregas" · "se puede asignar
// un responsable al grupo". Este <form> solo trae el selector de
// responsable/fecha y el botón de envío; las casillas de cada entrega viven
// en la lista renderizada por el Server Component (fuera de este form) y se
// asocian por id vía el atributo HTML `form="asignar-lote"` — así se evita
// anidar un <form> dentro de otro (los botones de reordenar de cada fila
// también son <form> propios), que es inválido en HTML.
export function AsignarLoteForm({
  action,
  funcionarios,
}: {
  action: AsignarLoteFormAction
  funcionarios: FuncionarioTerreno[]
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form id="asignar-lote" action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label htmlFor="responsable_id" className="text-sm font-medium text-text-primary">
          Asignar responsable a seleccionadas
        </label>
        <select
          id="responsable_id"
          name="responsable_id"
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary"
        >
          <option value="">Sin asignar</option>
          {funcionarios.map((funcionario) => (
            <option key={funcionario.id} value={funcionario.id}>
              {funcionario.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="fecha_programada" className="text-sm font-medium text-text-primary">
          Fecha programada
        </label>
        <input
          id="fecha_programada"
          name="fecha_programada"
          type="date"
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary"
        />
      </div>

      <Button type="submit" variante="secondary" disabled={pending}>
        {pending ? 'Asignando…' : 'Asignar a seleccionadas'}
      </Button>

      {state?.error && (
        <p role="alert" className="w-full text-sm text-danger-fg">
          {state.error}
        </p>
      )}
    </form>
  )
}
