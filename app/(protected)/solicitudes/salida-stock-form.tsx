'use client'

import { useActionState } from 'react'
import type { SalidaFormState } from '@/lib/inventario/actions'
import type { Producto } from '@/lib/inventario/types'
import { Button } from '@/components/ui/Button'

type SalidaStockFormAction = (
  state: SalidaFormState,
  formData: FormData
) => Promise<SalidaFormState>

export function SalidaStockForm({
  action,
  productos,
}: {
  action: SalidaStockFormAction
  productos: Producto[]
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const valores = state?.valores

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label htmlFor="producto_id" className="text-sm font-medium text-text-primary">
          Producto *
        </label>
        <select
          id="producto_id"
          name="producto_id"
          required
          defaultValue={valores?.producto_id ?? ''}
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary"
        >
          <option value="" disabled>
            Selecciona…
          </option>
          {productos.map((producto) => (
            <option key={producto.id} value={producto.id}>
              {producto.nombre} ({producto.stock_actual} {producto.unidad_medida} disponibles)
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="cantidad" className="text-sm font-medium text-text-primary">
          Cantidad *
        </label>
        <input
          id="cantidad"
          name="cantidad"
          type="number"
          min={1}
          step="1"
          required
          defaultValue={valores?.cantidad}
          className="w-24 rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="observacion" className="text-sm font-medium text-text-primary">
          Observación
        </label>
        <input
          id="observacion"
          name="observacion"
          defaultValue={valores?.observacion}
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary"
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? 'Registrando…' : 'Registrar salida'}
      </Button>

      {state?.error && (
        <p role="alert" className="w-full text-sm text-danger-fg">
          {state.error}
        </p>
      )}
    </form>
  )
}
