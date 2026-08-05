'use client'

import { useActionState } from 'react'
import type { ProductoFormState } from '@/lib/inventario/actions'

type ProductoFormAction = (
  state: ProductoFormState,
  formData: FormData
) => Promise<ProductoFormState>

export function ProductoForm({ action }: { action: ProductoFormAction }) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const valores = state?.valores

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-1">
        <label htmlFor="nombre" className="text-sm font-medium">
          Nombre *
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          defaultValue={valores?.nombre}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="categoria" className="text-sm font-medium">
          Categoría *
        </label>
        <input
          id="categoria"
          name="categoria"
          required
          placeholder="mercadería, pañales, materiales_construccion…"
          defaultValue={valores?.categoria}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="unidad_medida" className="text-sm font-medium">
          Unidad de medida *
        </label>
        <input
          id="unidad_medida"
          name="unidad_medida"
          required
          placeholder="unidad, caja, paquete, rollo, m3…"
          defaultValue={valores?.unidad_medida}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="stock_minimo" className="text-sm font-medium">
          Stock mínimo
        </label>
        <input
          id="stock_minimo"
          name="stock_minimo"
          type="number"
          min={0}
          step="1"
          defaultValue={valores?.stock_minimo ?? '0'}
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
        {pending ? 'Guardando…' : 'Crear producto'}
      </button>
    </form>
  )
}
