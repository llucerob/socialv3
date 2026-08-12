import type { ReactNode } from 'react'

// Sistema de diseño Coinco — Tanda A: primera barra de filtros multi-campo
// de la app (Solicitudes — listado). Patrón GET sin JS, mismo criterio que
// los filtros de un solo campo ya usados en DocumentosSection y en la
// sección de hitos de la ficha de hogar (?tipo_documento=, ?tipo_hito=):
// filtra sobre datos ya cargados por el server component, no agrega una
// consulta nueva. Se formaliza como componente porque Tandas B/C/D
// repetirán este patrón en otros listados.
export function FiltrosBar({ children, hrefLimpiar }: { children: ReactNode; hrefLimpiar?: string }) {
  return (
    <form className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
      {children}
      <button
        type="submit"
        className="rounded-lg border border-brand-600 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50"
      >
        Filtrar
      </button>
      {hrefLimpiar && (
        <a href={hrefLimpiar} className="text-sm text-brand-600 hover:underline">
          Limpiar filtros
        </a>
      )}
    </form>
  )
}

export function CampoFiltro({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="text-xs font-medium text-text-muted">
        {label}
      </label>
      {children}
    </div>
  )
}
