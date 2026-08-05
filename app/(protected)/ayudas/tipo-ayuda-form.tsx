'use client'

import { useActionState } from 'react'
import type { TipoAyudaFormState } from '@/lib/ayudas/actions'
import type { TipoAyuda } from '@/lib/ayudas/types'

type TipoAyudaFormAction = (
  state: TipoAyudaFormState,
  formData: FormData
) => Promise<TipoAyudaFormState>

const REGLAS: { name: keyof TipoAyuda; label: string }[] = [
  { name: 'requiere_aprobacion', label: 'Requiere aprobación' },
  { name: 'requiere_entrega', label: 'Requiere entrega' },
  { name: 'requiere_evidencia', label: 'Requiere evidencia' },
  { name: 'requiere_persona_beneficiaria', label: 'Requiere persona beneficiaria' },
  { name: 'requiere_documentos', label: 'Requiere documentos' },
]

export function TipoAyudaForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: TipoAyudaFormAction
  defaultValues?: Partial<TipoAyuda>
  submitLabel: string
}) {
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
          defaultValue={valores?.nombre ?? defaultValues?.nombre}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="descripcion" className="text-sm font-medium">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={2}
          defaultValue={valores?.descripcion ?? defaultValues?.descripcion ?? ''}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="tipo" className="text-sm font-medium">
          Tipo *
        </label>
        <input
          id="tipo"
          name="tipo"
          required
          placeholder="material, reembolso…"
          defaultValue={valores?.tipo ?? defaultValues?.tipo}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Reglas</legend>
        {REGLAS.map((regla) => (
          <label key={regla.name} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name={regla.name}
              defaultChecked={Boolean(
                (valores as Record<string, unknown> | undefined)?.[regla.name] ??
                  defaultValues?.[regla.name]
              )}
            />
            {regla.label}
          </label>
        ))}
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="tiene_tope_monetario"
              defaultChecked={valores?.tiene_tope_monetario ?? defaultValues?.tiene_tope_monetario}
            />
            Tiene tope monetario
          </label>
          <input
            name="tope_monetario"
            type="number"
            min={0}
            step="1"
            placeholder="Monto del tope, si aplica"
            defaultValue={valores?.tope_monetario ?? defaultValues?.tope_monetario ?? ''}
            className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="periodicidad" className="text-sm font-medium">
            Periodicidad
          </label>
          <input
            id="periodicidad"
            name="periodicidad"
            defaultValue={valores?.periodicidad ?? defaultValues?.periodicidad ?? ''}
            className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </div>
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
        {pending ? 'Guardando…' : submitLabel}
      </button>
    </form>
  )
}
