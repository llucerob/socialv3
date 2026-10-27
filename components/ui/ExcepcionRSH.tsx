import type { ReactNode } from 'react'

// Sistema de diseño Coinco — tratamiento visual único de excepción RSH /
// hitos sensibles (CLAUDE.md: "Excepciones nunca se ocultan"). Cualquier
// pantalla que muestre una ayuda aprobada por excepción debe usar estos
// componentes en vez de reimplementar el estilo, para que la regla de
// negocio quede garantizada por el componente, no por convención.
export function BadgeExcepcion({ texto = 'Excepción' }: { texto?: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-exception-bg px-3 py-1 text-xs font-bold text-exception-fg ring-1 ring-exception-border ring-inset">
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="size-3.5"
      >
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.63-1.516 2.63H3.72c-1.347 0-2.189-1.463-1.515-2.63L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
          clipRule="evenodd"
        />
      </svg>
      {texto}
    </span>
  )
}

export function CardExcepcion({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border-l-4 border-exception-border bg-exception-bg px-4 py-3 leading-relaxed text-exception-fg">
      {children}
    </div>
  )
}
