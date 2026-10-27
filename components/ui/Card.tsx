import type { ReactNode } from 'react'

// Sistema de diseño Coinco — Card base: superficie blanca sobre el fondo
// azulado bg-surface-app del layout shell, para que las Cards resalten.
// Refinamiento institucional: rounded-2xl + sombra sutil + ring slate-200
// (patrón Tarjeta de Regalos de Navidad) en vez de borde simple.
export type CardProps = {
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}

export function Card({ header, footer, children, className = '' }: CardProps) {
  return (
    <div className={`rounded-2xl bg-surface shadow-sm ring-1 ring-border-subtle ${className}`.trim()}>
      {header && <div className="border-b border-border-subtle px-5 py-4 sm:px-6">{header}</div>}
      <div className="px-5 py-4 sm:px-6">{children}</div>
      {footer && <div className="border-t border-border-subtle px-5 py-4 sm:px-6">{footer}</div>}
    </div>
  )
}
