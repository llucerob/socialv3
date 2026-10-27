import type { ButtonHTMLAttributes, ReactNode } from 'react'
import Link, { type LinkProps } from 'next/link'

// Sistema de diseño Coinco — variantes de botón sobre tokens de globals.css.
// Refinamiento institucional (estilo Regalos de Navidad): `primary` y
// `secondary` pasan al azul de marca brand-800 (antes brand-600), con
// altura mínima táctil de 44px (min-h-11) y peso semibold.
// `inverse` agregada en el Prompt 2: ninguna variante existente se ve sobre
// un fondo oscuro (ej. la cabecera bg-brand-800 de la ficha de hogar) — es
// un patrón que se repetirá en cualquier cabecera de marca, no solo ahí.
// `danger` agregada en la Tanda A: acciones destructivas (rechazar
// solicitud, anular) usaban `text-red-600` suelto; el sistema no tenía
// variante para esto — reutiliza los tokens `danger-*` (mismo tono que
// EstadoBadge para 'rechazada'), nunca el rojo `--red` del escudo.
export type VarianteBoton = 'primary' | 'secondary' | 'ghost' | 'inverse' | 'danger'

const CLASES_BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50'

const CLASES_POR_VARIANTE: Record<VarianteBoton, string> = {
  primary: 'bg-brand-800 text-white hover:bg-brand-900 disabled:hover:bg-brand-800',
  secondary:
    'border-2 border-brand-800 bg-surface text-brand-800 hover:bg-brand-50 disabled:hover:bg-surface',
  ghost: 'text-brand-600 hover:bg-brand-50 disabled:hover:bg-transparent',
  inverse: 'border-2 border-white/60 text-white hover:bg-white/10 disabled:hover:bg-transparent',
  danger:
    'border border-danger-fg/30 text-danger-fg hover:bg-danger-bg disabled:hover:bg-transparent',
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
