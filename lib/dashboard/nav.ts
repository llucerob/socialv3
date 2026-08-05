import type { RolUsuario } from '@/lib/auth/types'

// Estructura de navegación por rol (US-02.01: "estructura y navegación").
// `disponible: false` marca módulos que aún no existen — se activan a medida
// que se implementa el EPIC correspondiente, sin tener que rediseñar el nav.
export type NavItem = {
  label: string
  href: string
  disponible: boolean
}

export const NAV_BY_ROL: Record<RolUsuario, NavItem[]> = {
  administrador: [
    { label: 'Panel', href: '/dashboard', disponible: true },
    { label: 'Grupos familiares', href: '/hogares', disponible: true },
    { label: 'Catálogo de ayudas', href: '/ayudas', disponible: true },
    { label: 'Solicitudes', href: '/solicitudes', disponible: true },
    { label: 'Inventario', href: '/inventario', disponible: true },
    { label: 'Entregas', href: '/entregas', disponible: true },
    // US-13.05: hogares sin coordenadas — priorizar su regularización.
    { label: 'Hogares sin georreferenciar', href: '/hogares/pendientes-georreferenciar', disponible: true },
    { label: 'Reembolsos', href: '/reembolsos', disponible: false },
    { label: 'Auditoría', href: '/auditoria', disponible: true },
    // 🆕 EPIC 26: gestión de incidentes de seguridad (Ley 21.719).
    { label: 'Incidentes de seguridad', href: '/incidentes', disponible: true },
    { label: 'Reportes', href: '/reportes', disponible: true },
    { label: 'Administración', href: '/admin', disponible: true },
  ],
  evaluador_social: [
    { label: 'Panel', href: '/dashboard', disponible: true },
    { label: 'Grupos familiares', href: '/hogares', disponible: true },
    { label: 'Catálogo de ayudas', href: '/ayudas', disponible: true },
    { label: 'Solicitudes', href: '/solicitudes', disponible: true },
    { label: 'Informes sociales', href: '/informes-sociales', disponible: false },
  ],
  aprobador: [
    { label: 'Panel', href: '/dashboard', disponible: true },
    { label: 'Solicitudes', href: '/solicitudes', disponible: true },
  ],
  bodega_logistica: [
    { label: 'Panel', href: '/dashboard', disponible: true },
    // US-11.03: bodega necesita llegar al detalle de una solicitud aprobada
    // para registrar la salida de stock (ver sección "Stock" en esa página).
    { label: 'Solicitudes', href: '/solicitudes', disponible: true },
    { label: 'Inventario', href: '/inventario', disponible: true },
    { label: 'Entregas', href: '/entregas', disponible: true },
    { label: 'Hogares sin georreferenciar', href: '/hogares/pendientes-georreferenciar', disponible: true },
    // US-17.05: reporte de entregas pendientes y fallidas.
    { label: 'Reportes', href: '/reportes', disponible: true },
  ],
  terreno_repartidor: [
    { label: 'Panel', href: '/dashboard', disponible: true },
    { label: 'Mis entregas', href: '/mis-entregas', disponible: true },
    { label: 'Rutas de entrega', href: '/rutas', disponible: true },
  ],
  finanzas: [
    { label: 'Panel', href: '/dashboard', disponible: true },
    // US-14.02/US-14.04: finanzas valida documentos y registra pagos desde
    // el detalle de cada solicitud de reembolso — no hay un listado propio
    // separado todavía, reutiliza el mismo /solicitudes que los demás roles
    // de gestión (RLS ya le permite leer solicitudes y decisiones_solicitud).
    { label: 'Solicitudes', href: '/solicitudes', disponible: true },
    { label: 'Reembolsos', href: '/reembolsos', disponible: false },
    // US-17.03/US-17.04: reportes de reembolsos médicos y de diálisis.
    { label: 'Reportes', href: '/reportes', disponible: true },
  ],
  auditor_consulta: [
    { label: 'Panel', href: '/dashboard', disponible: true },
    { label: 'Grupos familiares', href: '/hogares', disponible: true },
    { label: 'Catálogo de ayudas', href: '/ayudas', disponible: true },
    { label: 'Solicitudes', href: '/solicitudes', disponible: true },
    { label: 'Auditoría', href: '/auditoria', disponible: true },
    // 🆕 EPIC 26 (US-26.02): "acceso restringido a administrador/auditor".
    { label: 'Incidentes de seguridad', href: '/incidentes', disponible: true },
    { label: 'Reportes', href: '/reportes', disponible: true },
  ],
}

// Punto único de "ruteo condicional por rol" (US-02.01). Hoy todos los roles
// caen en /dashboard porque es la única vista construida; a medida que existan
// landing pages propias por rol, este es el lugar donde se bifurca.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- rol se usará cuando existan landing pages propias por rol
export function getHomeRoute(rol: RolUsuario): string {
  return '/dashboard'
}
