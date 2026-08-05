'use client'

import { useActionState } from 'react'
import type { UsuarioFormState } from '@/lib/usuarios/actions'
import type { EstadoUsuario } from '@/lib/auth/types'

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
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-black/10 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-white/20"
      >
        {pending ? 'Guardando…' : estadoActual === 'activo' ? 'Desactivar' : 'Activar'}
      </button>
      {state?.error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  )
}
