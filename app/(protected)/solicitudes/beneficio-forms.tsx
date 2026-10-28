'use client'

import { useActionState } from 'react'
import type { BeneficioFormState } from '@/lib/beneficios/actions'
import { MODALIDAD_ENTREGA_LABELS, type ModalidadEntrega } from '@/lib/entregas/types'
import { Button } from '@/components/ui/Button'

type BeneficioAction = (state: BeneficioFormState, formData: FormData) => Promise<BeneficioFormState>

const CLASE_CAMPO = 'w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary'

// MR-08: cambiar la modalidad de un beneficio vigente (por ejemplo, el hogar
// pasa a retirar en el local). No toca lo ya entregado.
export function CambiarModalidadForm({
  action,
  modalidadActual,
}: {
  action: BeneficioAction
  modalidadActual: ModalidadEntrega
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const nueva: ModalidadEntrega = modalidadActual === 'domicilio' ? 'local' : 'domicilio'

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="modalidad" value={nueva} />
      <p className="text-sm text-text-primary">
        Pasar de <span className="font-medium">{MODALIDAD_ENTREGA_LABELS[modalidadActual]}</span> a{' '}
        <span className="font-medium">{MODALIDAD_ENTREGA_LABELS[nueva]}</span> para los próximos períodos.
      </p>
      <div className="space-y-1">
        <label htmlFor="motivo_modalidad" className="text-sm font-medium text-text-primary">
          Motivo *
        </label>
        <textarea
          id="motivo_modalidad"
          name="motivo"
          required
          rows={2}
          defaultValue={state?.valores.motivo}
          className={CLASE_CAMPO}
        />
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-danger-fg">
          {state.error}
        </p>
      )}
      <Button type="submit" variante="secondary" disabled={pending}>
        {pending ? 'Guardando…' : `Cambiar a ${MODALIDAD_ENTREGA_LABELS[nueva].toLowerCase()}`}
      </Button>
    </form>
  )
}

// MR-08: suspender un beneficio vigente. Los períodos pendientes se cancelan
// y la solicitud se cierra; lo entregado se conserva.
export function SuspenderBeneficioForm({ action }: { action: BeneficioAction }) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="space-y-3">
      <p className="text-sm text-text-primary">
        Los períodos que faltan se cancelan y la solicitud queda cerrada. Lo ya entregado se conserva. No se puede
        deshacer: para retomar la ayuda, el hogar necesita una nueva solicitud.
      </p>
      <div className="space-y-1">
        <label htmlFor="motivo_suspension" className="text-sm font-medium text-text-primary">
          Motivo de la suspensión *
        </label>
        <textarea
          id="motivo_suspension"
          name="motivo"
          required
          rows={2}
          defaultValue={state?.valores.motivo}
          className={CLASE_CAMPO}
        />
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-danger-fg">
          {state.error}
        </p>
      )}
      <Button type="submit" variante="secondary" disabled={pending} className="text-danger-fg">
        {pending ? 'Suspendiendo…' : 'Suspender beneficio'}
      </Button>
    </form>
  )
}
