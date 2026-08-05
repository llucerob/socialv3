'use client'

import { useActionState } from 'react'
import type { UsuarioFormState } from '@/lib/usuarios/actions'
import { ROL_LABELS, type RolUsuario } from '@/lib/auth/types'

const ROLES: RolUsuario[] = [
  'administrador',
  'evaluador_social',
  'aprobador',
  'bodega_logistica',
  'terreno_repartidor',
  'finanzas',
  'auditor_consulta',
]

type CambiarRolAction = (state: UsuarioFormState, formData: FormData) => Promise<UsuarioFormState>

export function CambiarRolForm({ action, rolActual }: { action: CambiarRolAction; rolActual: RolUsuario | null }) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <label htmlFor="rol" className="text-sm font-medium">
          Rol
        </label>
        <select
          id="rol"
          name="rol"
          defaultValue={rolActual ?? ''}
          className="rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
        >
          {!rolActual && (
            <option value="" disabled>
              Sin rol asignado
            </option>
          )}
          {ROLES.map((rol) => (
            <option key={rol} value={rol}>
              {ROL_LABELS[rol]}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-black/10 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-white/20"
      >
        {pending ? 'Guardando…' : 'Cambiar rol'}
      </button>
      {state?.error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  )
}
