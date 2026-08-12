import type { ReactNode } from 'react'

// Sistema de diseño Coinco — Tanda B: patrón repetido en rutas/page.tsx y
// entregas/page.tsx (EPIC 13): parada numerada de una ruta calculada por
// cercanía, con la dirección del hogar y sus acciones (ver detalle, mapa,
// reordenar). Se formaliza como componente para no duplicar el marcado en
// ambas pantallas.
export function ParadaRuta({
  orden,
  direccion,
  subtitulo,
  advertencia,
  children,
}: {
  orden: number
  direccion: string
  subtitulo?: ReactNode
  advertencia?: ReactNode
  children?: ReactNode
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3 text-sm">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-800">
        {orden}
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-medium text-text-primary">{direccion}</span>
        {advertencia && <span className="ml-2">{advertencia}</span>}
        {subtitulo && <span className="block text-text-muted">{subtitulo}</span>}
      </span>
      {children && <span className="flex shrink-0 items-center gap-2">{children}</span>}
    </li>
  )
}
