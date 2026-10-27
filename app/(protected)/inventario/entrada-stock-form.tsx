'use client'

import { useActionState } from 'react'
import type { EntradaFormState } from '@/lib/inventario/actions'
import type { CompraConNombres } from '@/lib/compras/types'
import { Button } from '@/components/ui/Button'
import { formatearFecha } from '@/lib/fechas'

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
  const claseCampo = 'w-full rounded-lg border border-border bg-transparent px-3 py-2 text-text-primary'

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div className="space-y-1">
        <label htmlFor="cantidad" className="text-sm font-medium text-text-primary">
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
          className={claseCampo}
        />
      </div>

      {compras.length > 0 && (
        <div className="space-y-1">
          <label htmlFor="compra_id" className="text-sm font-medium text-text-primary">
            Compra asociada
          </label>
          <select id="compra_id" name="compra_id" defaultValue={valores?.compra_id ?? ''} className={claseCampo}>
            <option value="">Ninguna (ingreso manual)</option>
            {compras.map((compra) => (
              <option key={compra.id} value={compra.id}>
                OC {compra.numero_orden_compra} · {compra.proveedor_nombre} · {formatearFecha(compra.fecha_compra)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="observacion" className="text-sm font-medium text-text-primary">
          Observación
        </label>
        <textarea id="observacion" name="observacion" rows={2} defaultValue={valores?.observacion} className={claseCampo} />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-danger-fg">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : 'Registrar entrada'}
      </Button>
    </form>
  )
}
