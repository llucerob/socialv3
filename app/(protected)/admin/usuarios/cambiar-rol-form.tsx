'use client'

import { useActionState } from 'react'
import type { UsuarioFormState } from '@/lib/usuarios/actions'
import { ROL_LABELS, type RolUsuario } from '@/lib/auth/types'
import { Button } from '@/components/ui/Button'

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
        <label htmlFor="rol" className="text-sm font-medium text-text-primary">
          Rol
        </label>
        <select
          id="rol"
          name="rol"
          defaultValue={rolActual ?? ''}
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary"
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
      <Button type="submit" variante="secondary" disabled={pending}>
        {pending ? 'Guardando…' : 'Cambiar rol'}
      </Button>
      {state?.error && (
        <p role="alert" className="w-full text-sm text-danger-fg">
          {state.error}
        </p>
      )}
    </form>
  )
}
