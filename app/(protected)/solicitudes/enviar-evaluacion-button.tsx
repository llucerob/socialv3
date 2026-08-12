'use client'

import { useActionState } from 'react'
import { enviarAEvaluacion } from '@/lib/solicitudes/actions'
import { Button } from '@/components/ui/Button'

export function EnviarEvaluacionButton({ solicitudId }: { solicitudId: string }) {
  const accion = enviarAEvaluacion.bind(null, solicitudId)
  const [state, formAction, pending] = useActionState(accion, undefined)

  return (
    <form action={formAction} className="space-y-2">
      <Button type="submit" disabled={pending}>
        {pending ? 'Enviando…' : 'Enviar a evaluación'}
      </Button>
      {state?.bloqueado && (
        <p role="alert" className="max-w-md text-sm text-danger-fg">
          {state.bloqueado}
        </p>
      )}
    </form>
  )
}
