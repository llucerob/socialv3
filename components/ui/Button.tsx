import type { ButtonHTMLAttributes, ReactNode } from 'react'
import Link, { type LinkProps } from 'next/link'

// Sistema de diseño Coinco — variantes de botón sobre tokens de globals.css.
// `primary` usa brand-600 (accionable), nunca brand-800 (reservado a marca).
// `inverse` agregada en el Prompt 2: ninguna variante existente se ve sobre
// un fondo oscuro (ej. la cabecera bg-brand-800 de la ficha de hogar) — es
// un patrón que se repetirá en cualquier cabecera de marca, no solo ahí.
export type VarianteBoton = 'primary' | 'secondary' | 'ghost' | 'inverse'

const CLASES_BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const CLASES_POR_VARIANTE: Record<VarianteBoton, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-800 disabled:hover:bg-brand-600',
  secondary:
    'border border-brand-600 text-brand-600 hover:bg-brand-50 disabled:hover:bg-transparent',
  ghost: 'text-brand-600 hover:bg-brand-50 disabled:hover:bg-transparent',
  inverse: 'border border-white/40 text-white hover:bg-white/10 disabled:hover:bg-transparent',
}

function clasesBoton(variante: VarianteBoton, className: string): string {
  return `${CLASES_BASE} ${CLASES_POR_VARIANTE[variante]} ${className}`.trim()
}

export type BotonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBoton
}

export function Button({ variante = 'primary', className = '', ...props }: BotonProps) {
  return <button className={clasesBoton(variante, className)} {...props} />
}

// Accesos rápidos / navegación (Prompt 2, dashboard): mismo lenguaje visual
// que Button pero como enlace real de Next.js, para no perder prefetch/SPA
// navigation envolviendo un <Link> dentro de un <button>.
export type BotonEnlaceProps = LinkProps & {
  variante?: VarianteBoton
  className?: string
  children?: ReactNode
}

export function ButtonLink({ variante = 'primary', className = '', ...props }: BotonEnlaceProps) {
  return <Link className={clasesBoton(variante, className)} {...props} />
}
