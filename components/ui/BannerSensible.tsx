import type { ReactNode } from 'react'

// Sistema de diseño Coinco — agregado en el Prompt 2 al vestir la ficha de
// hogar: ni EstadoBadge ni ExcepcionRSH cubrían la señalización de "dato
// sensible" que pide CLAUDE.md para hitos e informes sociales (control de
// acceso ya resuelto por el código que llama a este componente — este solo
// aporta la señal visual, no decide quién lo ve). Reutiliza los tokens
// `exception-*` (dorado) porque es la misma semántica de "no pasa
// desapercibido", aplicada aquí a confidencialidad en vez de excepción RSH.
export function BannerSensible({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border-l-4 border-exception-border bg-exception-bg px-3 py-2 text-xs text-exception-fg">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 size-4 shrink-0"
      >
        <rect x="5" y="11" width="14" height="9" rx="1.5" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
      <span>{children}</span>
    </div>
  )
}
