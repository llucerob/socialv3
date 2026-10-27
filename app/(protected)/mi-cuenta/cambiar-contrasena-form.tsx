'use client'

import { useActionState } from 'react'
import type { CambiarContrasenaState } from '@/lib/auth/actions'
import { LARGO_MINIMO_CONTRASENA } from '@/lib/auth/types'
import { Button } from '@/components/ui/Button'

type CambiarContrasenaAction = (
  state: CambiarContrasenaState,
  formData: FormData
) => Promise<CambiarContrasenaState>

const CLASES_INPUT = 'w-full rounded-lg border border-border bg-transparent px-3 py-2 text-text-primary'

export function CambiarContrasenaForm({ action }: { action: CambiarContrasenaAction }) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="actual" className="text-sm font-medium text-text-primary">
          Contraseña actual
        </label>
        <input
          id="actual"
          name="actual"
          type="password"
          required
          autoComplete="current-password"
          className={CLASES_INPUT}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="nueva" className="text-sm font-medium text-text-primary">
          Nueva contraseña
        </label>
        <input
          id="nueva"
          name="nueva"
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
          Repite la nueva contraseña
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

      {state?.error && (
        <p role="alert" className="text-sm text-danger-fg">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-sm text-success-fg">
          Contraseña actualizada. Úsala la próxima vez que inicies sesión.
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : 'Cambiar contraseña'}
      </Button>
    </form>
  )
}
