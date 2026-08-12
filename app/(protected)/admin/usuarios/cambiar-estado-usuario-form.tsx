'use client'

import { useActionState } from 'react'
import type { UsuarioFormState } from '@/lib/usuarios/actions'
import type { EstadoUsuario } from '@/lib/auth/types'
import { Button } from '@/components/ui/Button'

type CambiarEstadoAction = (state: UsuarioFormState, formData: FormData) => Promise<UsuarioFormState>

export function CambiarEstadoUsuarioForm({
  action,
  estadoActual,
}: {
  action: CambiarEstadoAction
  estadoActual: EstadoUsuario
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="estado" value={estadoActual === 'activo' ? 'inactivo' : 'activo'} />
      <Button type="submit" variante="secondary" disabled={pending}>
        {pending ? 'Guardando…' : estadoActual === 'activo' ? 'Desactivar' : 'Activar'}
      </Button>
      {state?.error && (
        <p role="alert" className="w-full text-sm text-danger-fg">
          {state.error}
        </p>
      )}
    </form>
  )
}
