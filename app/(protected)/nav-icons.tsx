import type { ReactNode } from 'react'

// Sistema de diseño Coinco (Prompt 1) — íconos de navegación. El repo no
// tiene una librería de íconos como dependencia; en vez de agregar una solo
// para el sidebar, se usan trazos SVG simples y genéricos por módulo,
// mapeados por el `label` real de lib/dashboard/nav.ts. `Generico` cubre
// cualquier item nuevo sin ícono propio para que el sidebar nunca falle.
function Trazo({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5 shrink-0"
    >
      {children}
    </svg>
  )
}

const ICONOS_POR_LABEL: Record<string, ReactNode> = {
  Panel: (
    <Trazo>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </Trazo>
  ),
  'Grupos familiares': (
    <Trazo>
      <circle cx="9" cy="8" r="2.5" />
      <circle cx="16" cy="9" r="2" />
      <path d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5" />
      <path d="M14.5 14.3c2.3.3 4 2.2 4 4.7" />
    </Trazo>
  ),
  'Catálogo de ayudas': (
    <Trazo>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </Trazo>
  ),
  Solicitudes: (
    <Trazo>
      <rect x="5" y="3.5" width="14" height="17" rx="1.5" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
    </Trazo>
  ),
  Inventario: (
    <Trazo>
      <path d="M3.5 8 12 4l8.5 4-8.5 4-8.5-4Z" />
      <path d="M3.5 8v8L12 20l8.5-4V8M12 12v8" />
    </Trazo>
  ),
  Entregas: (
    <Trazo>
      <rect x="3" y="9" width="12" height="8" rx="1" />
      <path d="M15 12h3l3 3v2h-6z" />
      <circle cx="7" cy="19" r="1.5" />
      <circle cx="16.5" cy="19" r="1.5" />
    </Trazo>
  ),
  'Hogares sin georreferenciar': (
    <Trazo>
      <path d="M12 21s-6.5-5.4-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.6 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2" />
    </Trazo>
  ),
  Reembolsos: (
    <Trazo>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M9.5 14c0 1.1 1 2 2.5 2s2.5-.8 2.5-1.9c0-2.6-5-1.2-5-3.8 0-1.1 1-1.9 2.5-1.9s2.5.8 2.5 1.7" />
    </Trazo>
  ),
  Auditoría: (
    <Trazo>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m19.5 19.5-4.2-4.2" />
    </Trazo>
  ),
  'Incidentes de seguridad': (
    <Trazo>
      <path d="M12 3.5 5 6.5v5c0 5 3 8 7 9 4-1 7-4 7-9v-5l-7-3Z" />
      <path d="M12 8.5v4M12 15.5h.01" />
    </Trazo>
  ),
  Reportes: (
    <Trazo>
      <path d="M5 19V9M11 19V5M17 19v-6" />
      <path d="M3.5 19h17" />
    </Trazo>
  ),
  Administración: (
    <Trazo>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2M12 18.5v2M4.9 6.9l1.4 1.4M17.7 15.7l1.4 1.4M3.5 12h2M18.5 12h2M4.9 17.1l1.4-1.4M17.7 8.3l1.4-1.4" />
    </Trazo>
  ),
  'Informes sociales': (
    <Trazo>
      <path d="M7 3.5h7l3.5 3.5V20.5h-10.5Z" />
      <path d="M9 11h6M9 14.5h6" />
    </Trazo>
  ),
  'Mis entregas': (
    <Trazo>
      <path d="M4.5 12.5 10 18l9.5-11" />
    </Trazo>
  ),
  'Rutas de entrega': (
    <Trazo>
      <circle cx="6" cy="6.5" r="2" />
      <circle cx="18" cy="17.5" r="2" />
      <path d="M6 8.5c0 5 12 3 12 9" />
    </Trazo>
  ),
}

const GENERICO = (
  <Trazo>
    <circle cx="12" cy="12" r="8" />
  </Trazo>
)

export function NavIcon({ label }: { label: string }) {
  return <>{ICONOS_POR_LABEL[label] ?? GENERICO}</>
}
