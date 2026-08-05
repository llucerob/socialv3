'use client'

import { useActionState } from 'react'
import type { SalidaFormState } from '@/lib/inventario/actions'
import type { Producto } from '@/lib/inventario/types'

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
        <label htmlFor="producto_id" className="text-sm font-medium">
          Producto *
        </label>
        <select
          id="producto_id"
          name="producto_id"
          required
          defaultValue={valores?.producto_id ?? ''}
          className="rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
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
        <label htmlFor="cantidad" className="text-sm font-medium">
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
          className="w-24 rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="observacion" className="text-sm font-medium">
          Observación
        </label>
        <input
          id="observacion"
          name="observacion"
          defaultValue={valores?.observacion}
          className="rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Registrando…' : 'Registrar salida'}
      </button>

      {state?.error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  )
}
