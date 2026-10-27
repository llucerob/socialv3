'use client'

import { useActionState } from 'react'
import type { UsuarioFormState } from '@/lib/usuarios/actions'
import { ROL_LABELS, type RolUsuario } from '@/lib/auth/types'
import { ROL_DESCRIPCIONES, ROLES_ORDENADOS } from '@/lib/auth/roles'
import { Button } from '@/components/ui/Button'

type CambiarRolesAction = (state: UsuarioFormState, formData: FormData) => Promise<UsuarioFormState>

// Un usuario puede tener varios roles: cada permiso se concede si tiene
// alguno de los roles que lo habilitan. `esUnoMismo` bloquea la casilla de
// administrador para que nadie se quite ese rol a sí mismo (también se
// valida en el servidor, ver cambiarRolesUsuario).
export function CambiarRolesForm({
  action,
  rolesActuales,
  esUnoMismo,
}: {
  action: CambiarRolesAction
  rolesActuales: RolUsuario[]
  esUnoMismo: boolean
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="max-w-2xl space-y-3">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-text-primary">Roles</legend>
        <p className="text-xs text-text-muted">
          Marca todos los que correspondan. Un usuario sin ningún rol no puede operar en el sistema.
        </p>
        {ROLES_ORDENADOS.map((rol) => {
          const bloqueado = esUnoMismo && rol === 'administrador'
          return (
            <label
              key={rol}
              className="flex items-start gap-3 rounded-lg border border-border-subtle bg-surface px-3 py-2"
            >
              <input
                type="checkbox"
                name="roles"
                value={rol}
                defaultChecked={rolesActuales.includes(rol)}
                disabled={bloqueado}
                className="mt-1 h-4 w-4"
              />
              {/* Una casilla deshabilitada no se envía: se reenvía el valor
                  como hidden para no quitar el rol por accidente. */}
              {bloqueado && <input type="hidden" name="roles" value={rol} />}
              <span>
                <span className="block text-sm font-medium text-text-primary">{ROL_LABELS[rol]}</span>
                <span className="block text-xs text-text-muted">
                  {ROL_DESCRIPCIONES[rol]}
                  {bloqueado && ' No puedes quitarte este rol a ti mismo.'}
                </span>
              </span>
            </label>
          )
        })}
      </fieldset>
      <Button type="submit" variante="secondary" disabled={pending}>
        {pending ? 'Guardando…' : 'Guardar roles'}
      </Button>
      {state?.error && (
        <p role="alert" className="text-sm text-danger-fg">
          {state.error}
        </p>
      )}
    </form>
  )
}
