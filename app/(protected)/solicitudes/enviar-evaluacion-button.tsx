'use client'

import { useActionState } from 'react'
import { enviarAEvaluacion } from '@/lib/solicitudes/actions'

export function EnviarEvaluacionButton({ solicitudId }: { solicitudId: string }) {
  const accion = enviarAEvaluacion.bind(null, solicitudId)
  const [state, formAction, pending] = useActionState(accion, undefined)

  return (
    <form action={formAction} className="space-y-2">
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Enviando…' : 'Enviar a evaluación'}
      </button>
      {state?.bloqueado && (
        <p role="alert" className="max-w-md text-sm text-red-600">
          {state.bloqueado}
        </p>
      )}
    </form>
  )
}
