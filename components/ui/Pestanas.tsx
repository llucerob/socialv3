import Link from 'next/link'

// MR-04: pestañas de navegación para fichas largas (ej. ficha del grupo
// familiar). Son enlaces con la pestaña en la URL (?tab=), no estado de
// cliente: se renderizan en el servidor, se pueden enlazar y recargar, y el
// botón "atrás" vuelve a la pestaña anterior. Solo se renderiza el
// contenido de la pestaña activa.
export type Pestana = {
  id: string
  label: string
  href: string
  contador?: number
  // Marca la pestaña como información sensible (hitos, informes sociales).
  sensible?: boolean
}

export function Pestanas({
  pestanas,
  activa,
  etiqueta,
}: {
  pestanas: Pestana[]
  activa: string
  etiqueta: string
}) {
  return (
    // overflow-x-auto: en móvil la barra se desplaza sola, sin scroll
    // horizontal en la página.
    <nav aria-label={etiqueta} className="overflow-x-auto">
      <ul className="flex min-w-max gap-1 border-b border-border">
        {pestanas.map((pestana) => {
          const esActiva = pestana.id === activa
          return (
            <li key={pestana.id}>
              <Link
                href={pestana.href}
                scroll={false}
                aria-current={esActiva ? 'page' : undefined}
                className={`-mb-px inline-flex min-h-11 items-center gap-2 border-b-2 px-4 py-2 text-sm font-semibold transition ${
                  esActiva
                    ? 'border-brand-800 text-brand-800'
                    : 'border-transparent text-text-muted hover:border-border hover:text-text-primary'
                }`}
              >
                {pestana.sensible && (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4"
                  >
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                )}
                {pestana.label}
                {pestana.sensible && <span className="sr-only">(información sensible)</span>}
                {pestana.contador !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      esActiva ? 'bg-brand-800 text-white' : 'bg-surface-alt text-text-muted'
                    }`}
                  >
                    {pestana.contador}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
