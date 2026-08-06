import { ROL_LABELS, type RolUsuario } from '@/lib/auth/types'
import { iniciales } from '@/components/ui/texto'
import { LogoutButton } from './logout-button'

// Sistema de diseño Coinco (Prompt 1, Paso 3) — topbar institucional:
// bg-surface + borde inferior border-border (paleta clara), saludo/rol a la
// izquierda, notificaciones + avatar a la derecha. No hay un sistema de
// notificaciones implementado todavía — el ícono queda como affordance
// visual sin contador ni datos simulados, para no fabricar información que
// el backend no produce.

export function Topbar({ nombre, rol }: { nombre: string; rol: RolUsuario }) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:px-6">
      <div>
        <p className="text-sm font-semibold text-text-primary">Hola, {nombre}</p>
        <p className="text-xs text-text-muted">{ROL_LABELS[rol]}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notificaciones"
          className="rounded-full p-2 text-text-muted hover:bg-surface-alt"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
          >
            <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z" />
            <path d="M10 18a2 2 0 0 0 4 0" />
          </svg>
        </button>
        <div
          className="flex size-8 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-800"
          aria-hidden="true"
        >
          {iniciales(nombre)}
        </div>
        <LogoutButton />
      </div>
    </header>
  )
}
