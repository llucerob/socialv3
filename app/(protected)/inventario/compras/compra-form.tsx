'use client'

import { useActionState } from 'react'
import type { CompraFormState } from '@/lib/compras/actions'
import type { Producto } from '@/lib/inventario/types'
import type { Proveedor } from '@/lib/proveedores/types'

type CompraFormAction = (state: CompraFormState, formData: FormData) => Promise<CompraFormState>

const INPUT_CLASSNAME = 'w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20'

// US-24.02: "campos mínimos" del backlog — tipo de producto, proveedor,
// número de orden de compra, fechas, cantidad, valores, documento
// tributario, funcionario responsable (este último es quien está
// autenticado, no un campo del formulario — mismo criterio que
// registrado_por en el resto del proyecto).
export function CompraForm({
  action,
  productos,
  proveedores,
}: {
  action: CompraFormAction
  productos: Producto[]
  proveedores: Proveedor[]
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const valores = state?.valores

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="producto_id" className="text-sm font-medium">
            Producto *
          </label>
          <select
            id="producto_id"
            name="producto_id"
            required
            defaultValue={valores?.producto_id ?? ''}
            className={INPUT_CLASSNAME}
          >
            <option value="" disabled>
              Selecciona…
            </option>
            {productos.map((producto) => (
              <option key={producto.id} value={producto.id}>
                {producto.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="proveedor_id" className="text-sm font-medium">
            Proveedor *
          </label>
          <select
            id="proveedor_id"
            name="proveedor_id"
            required
            defaultValue={valores?.proveedor_id ?? ''}
            className={INPUT_CLASSNAME}
          >
            <option value="" disabled>
              Selecciona…
            </option>
            {proveedores.map((proveedor) => (
              <option key={proveedor.id} value={proveedor.id}>
                {proveedor.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="numero_orden_compra" className="text-sm font-medium">
          Número de orden de compra *
        </label>
        <input
          id="numero_orden_compra"
          name="numero_orden_compra"
          required
          defaultValue={valores?.numero_orden_compra ?? ''}
          className={INPUT_CLASSNAME}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="fecha_compra" className="text-sm font-medium">
            Fecha de compra *
          </label>
          <input
            id="fecha_compra"
            name="fecha_compra"
            type="date"
            required
            defaultValue={valores?.fecha_compra ?? ''}
            className={INPUT_CLASSNAME}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="fecha_recepcion" className="text-sm font-medium">
            Fecha de recepción
          </label>
          <input
            id="fecha_recepcion"
            name="fecha_recepcion"
            type="date"
            defaultValue={valores?.fecha_recepcion ?? ''}
            className={INPUT_CLASSNAME}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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
            defaultValue={valores?.cantidad ?? ''}
            className={INPUT_CLASSNAME}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="valor_unitario" className="text-sm font-medium">
            Valor unitario *
          </label>
          <input
            id="valor_unitario"
            name="valor_unitario"
            type="number"
            min={0}
            step="1"
            required
            defaultValue={valores?.valor_unitario ?? ''}
            className={INPUT_CLASSNAME}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="valor_total" className="text-sm font-medium">
            Valor total *
          </label>
          <input
            id="valor_total"
            name="valor_total"
            type="number"
            min={0}
            step="1"
            required
            defaultValue={valores?.valor_total ?? ''}
            className={INPUT_CLASSNAME}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="documento_tributario" className="text-sm font-medium">
          Documento tributario asociado
        </label>
        <input
          id="documento_tributario"
          name="documento_tributario"
          placeholder="Ej. Factura N° 12345"
          defaultValue={valores?.documento_tributario ?? ''}
          className={INPUT_CLASSNAME}
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
        {pending ? 'Guardando…' : 'Registrar compra'}
      </button>
    </form>
  )
}
