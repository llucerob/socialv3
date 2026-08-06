import type { ReactNode } from 'react'

// Sistema de diseño Coinco — Card base: superficie blanca sobre el fondo
// bg-surface-alt del layout shell (Paso 3), para que las Cards resalten.
export type CardProps = {
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}

export function Card({ header, footer, children, className = '' }: CardProps) {
  return (
    <div className={`rounded-xl border border-border bg-surface ${className}`.trim()}>
      {header && <div className="border-b border-border px-4 py-3">{header}</div>}
      <div className="px-4 py-3">{children}</div>
      {footer && <div className="border-t border-border px-4 py-3">{footer}</div>}
    </div>
  )
}
