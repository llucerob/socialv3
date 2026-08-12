'use client'

import { useActionState } from 'react'
import type { ProductoFormState } from '@/lib/inventario/actions'
import { Button } from '@/components/ui/Button'

type ProductoFormAction = (
  state: ProductoFormState,
  formData: FormData
) => Promise<ProductoFormState>

export function ProductoForm({ action }: { action: ProductoFormAction }) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const valores = state?.valores
  const claseCampo = 'w-full rounded-lg border border-border bg-transparent px-3 py-2 text-text-primary'

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-1">
        <label htmlFor="nombre" className="text-sm font-medium text-text-primary">
          Nombre *
        </label>
        <input id="nombre" name="nombre" required defaultValue={valores?.nombre} className={claseCampo} />
      </div>

      <div className="space-y-1">
        <label htmlFor="categoria" className="text-sm font-medium text-text-primary">
          Categoría *
        </label>
        <input
          id="categoria"
          name="categoria"
          required
          placeholder="mercadería, pañales, materiales_construccion…"
          defaultValue={valores?.categoria}
          className={claseCampo}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="unidad_medida" className="text-sm font-medium text-text-primary">
          Unidad de medida *
        </label>
        <input
          id="unidad_medida"
          name="unidad_medida"
          required
          placeholder="unidad, caja, paquete, rollo, m3…"
          defaultValue={valores?.unidad_medida}
          className={claseCampo}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="stock_minimo" className="text-sm font-medium text-text-primary">
          Stock mínimo
        </label>
        <input
          id="stock_minimo"
          name="stock_minimo"
          type="number"
          min={0}
          step="1"
          defaultValue={valores?.stock_minimo ?? '0'}
          className={claseCampo}
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-danger-fg">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : 'Crear producto'}
      </Button>
    </form>
  )
}
