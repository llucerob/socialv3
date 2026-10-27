'use client'

import { useActionState } from 'react'
import type { CrearUsuarioFormState } from '@/lib/usuarios/actions'
import { LARGO_MINIMO_CONTRASENA, ROL_LABELS } from '@/lib/auth/types'
import { ROL_DESCRIPCIONES, ROLES_ORDENADOS } from '@/lib/auth/roles'
import { Button } from '@/components/ui/Button'

type CrearUsuarioAction = (state: CrearUsuarioFormState, formData: FormData) => Promise<CrearUsuarioFormState>

const CLASES_INPUT = 'w-full rounded-lg border border-border bg-transparent px-3 py-2 text-text-primary'

export function CrearUsuarioForm({ action }: { action: CrearUsuarioAction }) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const valores = state?.valores

  return (
    // key: tras enviar, React reinicia los campos no controlados; si el
    // servidor rechaza el formulario se remontan con los valores devueltos.
    <form key={JSON.stringify(valores ?? null)} action={formAction} className="max-w-2xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="nombre" className="text-sm font-medium text-text-primary">
            Nombre *
          </label>
          <input id="nombre" name="nombre" required defaultValue={valores?.nombre} className={CLASES_INPUT} />
        </div>
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-text-primary">
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="off"
            defaultValue={valores?.email}
            className={CLASES_INPUT}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="contrasena" className="text-sm font-medium text-text-primary">
            Contraseña inicial *
          </label>
          <input
            id="contrasena"
            name="contrasena"
            type="password"
            required
            minLength={LARGO_MINIMO_CONTRASENA}
            autoComplete="new-password"
            className={CLASES_INPUT}
          />
          <p className="text-xs text-text-muted">Mínimo {LARGO_MINIMO_CONTRASENA} caracteres.</p>
        </div>
        <div className="space-y-1">
          <label htmlFor="confirmacion" className="text-sm font-medium text-text-primary">
            Repite la contraseña *
          </label>
          <input
            id="confirmacion"
            name="confirmacion"
            type="password"
            required
            minLength={LARGO_MINIMO_CONTRASENA}
            autoComplete="new-password"
            className={CLASES_INPUT}
          />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-text-primary">Roles *</legend>
        <p className="text-xs text-text-muted">
          Marca todos los que correspondan. Un usuario sin ningún rol no puede operar en el sistema.
        </p>
        {ROLES_ORDENADOS.map((rol) => (
          <label
            key={rol}
            className="flex items-start gap-3 rounded-lg border border-border-subtle bg-surface px-3 py-2"
          >
            <input
              type="checkbox"
              name="roles"
              value={rol}
              defaultChecked={valores?.roles.includes(rol)}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block text-sm font-medium text-text-primary">{ROL_LABELS[rol]}</span>
              <span className="block text-xs text-text-muted">{ROL_DESCRIPCIONES[rol]}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {state?.error && (
        <p role="alert" className="text-sm text-danger-fg">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Creando…' : 'Crear usuario'}
      </Button>
    </form>
  )
}
