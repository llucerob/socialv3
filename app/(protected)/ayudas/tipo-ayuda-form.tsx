'use client'

import { useActionState } from 'react'
import type { TipoAyudaFormState } from '@/lib/ayudas/actions'
import type { TipoAyuda } from '@/lib/ayudas/types'
import { PERIODICIDADES_BENEFICIO, PERIODICIDAD_BENEFICIO_LABELS } from '@/lib/beneficios/types'
import { Button } from '@/components/ui/Button'

type TipoAyudaFormAction = (
  state: TipoAyudaFormState,
  formData: FormData
) => Promise<TipoAyudaFormState>

const REGLAS: { name: keyof TipoAyuda; label: string }[] = [
  { name: 'requiere_aprobacion', label: 'Requiere aprobación' },
  { name: 'requiere_entrega', label: 'Requiere entrega' },
  // MR-06
  { name: 'permite_entrega_local', label: 'Permite entrega en local (además de a domicilio)' },
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
  const claseCampo = 'w-full rounded-lg border border-border bg-transparent px-3 py-2 text-text-primary'

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-1">
        <label htmlFor="nombre" className="text-sm font-medium text-text-primary">
          Nombre *
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          defaultValue={valores?.nombre ?? defaultValues?.nombre}
          className={claseCampo}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="descripcion" className="text-sm font-medium text-text-primary">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={2}
          defaultValue={valores?.descripcion ?? defaultValues?.descripcion ?? ''}
          className={claseCampo}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="tipo" className="text-sm font-medium text-text-primary">
          Tipo *
        </label>
        <input
          id="tipo"
          name="tipo"
          required
          placeholder="material, reembolso…"
          defaultValue={valores?.tipo ?? defaultValues?.tipo}
          className={claseCampo}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-text-primary">Reglas</legend>
        {REGLAS.map((regla) => (
          <label key={regla.name} className="flex items-center gap-2 text-sm text-text-primary">
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
          <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
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
            className={claseCampo}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="periodicidad" className="text-sm font-medium text-text-primary">
            Periodicidad (descripción)
          </label>
          <input
            id="periodicidad"
            name="periodicidad"
            defaultValue={valores?.periodicidad ?? defaultValues?.periodicidad ?? ''}
            className={claseCampo}
          />
        </div>
      </div>

      {/* MR-08 */}
      <div className="space-y-1">
        <label htmlFor="periodicidad_beneficio" className="text-sm font-medium text-text-primary">
          Beneficio periódico
        </label>
        <select
          id="periodicidad_beneficio"
          name="periodicidad_beneficio"
          defaultValue={valores?.periodicidad_beneficio ?? defaultValues?.periodicidad_beneficio ?? ''}
          className={claseCampo}
        >
          <option value="">No: ayuda única (una sola entrega)</option>
          {PERIODICIDADES_BENEFICIO.map((periodicidad) => (
            <option key={periodicidad} value={periodicidad}>
              Sí, {PERIODICIDAD_BENEFICIO_LABELS[periodicidad].toLowerCase()} por defecto
            </option>
          ))}
        </select>
        <p className="text-xs text-text-muted">
          Al aprobar, el beneficio se entrega cada período desde el mes de aprobación hasta diciembre. El
          aprobador confirma la periodicidad de cada caso. Requiere entrega.
        </p>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-danger-fg">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : submitLabel}
      </Button>
    </form>
  )
}
