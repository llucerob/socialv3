'use client'

import { useActionState } from 'react'
import type { EntradaFormState } from '@/lib/inventario/actions'
import type { CompraConNombres } from '@/lib/compras/types'

type EntradaStockFormAction = (
  state: EntradaFormState,
  formData: FormData
) => Promise<EntradaFormState>

// US-24.03: "el ingreso de stock puede referenciar una compra registrada" —
// `compras` es opcional en sentido literal (siempre puede venir vacío,
// EPIC 24 es P2) y ya viene filtrado por el producto de esta entrada
// (lib/compras/dal.ts, listarComprasDeProducto).
export function EntradaStockForm({
  action,
  compras,
}: {
  action: EntradaStockFormAction
  compras: CompraConNombres[]
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const valores = state?.valores

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div className="space-y-1">
        <label htmlFor="cantidad" className="text-sm font-medium">
          Cantidad ingresada *
        </label>
        <input
          id="cantidad"
          name="cantidad"
          type="number"
          min={1}
          step="1"
          required
          defaultValue={valores?.cantidad}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </div>

      {compras.length > 0 && (
        <div className="space-y-1">
          <label htmlFor="compra_id" className="text-sm font-medium">
            Compra asociada
          </label>
          <select
            id="compra_id"
            name="compra_id"
            defaultValue={valores?.compra_id ?? ''}
            className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
          >
            <option value="">Ninguna (ingreso manual)</option>
            {compras.map((compra) => (
              <option key={compra.id} value={compra.id}>
                OC {compra.numero_orden_compra} · {compra.proveedor_nombre} · {compra.fecha_compra}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="observacion" className="text-sm font-medium">
          Observación
        </label>
        <textarea
          id="observacion"
          name="observacion"
          rows={2}
          defaultValue={valores?.observacion}
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
        {pending ? 'Guardando…' : 'Registrar entrada'}
      </button>
    </form>
  )
}
