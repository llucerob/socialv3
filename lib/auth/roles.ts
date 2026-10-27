import { ROL_LABELS, type RolUsuario } from './types'

// Orden fijo para mostrar y combinar roles (menú, etiquetas), independiente
// del orden en que el administrador los asignó.
export const ROLES_ORDENADOS: RolUsuario[] = [
  'administrador',
  'evaluador_social',
  'aprobador',
  'bodega_logistica',
  'terreno_repartidor',
  'finanzas',
  'auditor_consulta',
]

// Equivalente en la app de tiene_rol() en la base: el permiso se concede si
// el usuario tiene alguno de los roles que lo habilitan.
export function tieneRol(
  perfil: { roles: readonly RolUsuario[] },
  roles: readonly RolUsuario[]
): boolean {
  return perfil.roles.some((rol) => roles.includes(rol))
}

export function etiquetaRoles(roles: readonly RolUsuario[]): string {
  if (roles.length === 0) return 'Sin rol'
  return ROLES_ORDENADOS.filter((rol) => roles.includes(rol))
    .map((rol) => ROL_LABELS[rol])
    .join(' · ')
}

// Qué habilita cada rol, para la pantalla de asignación de roles. Resume
// los permisos reales (RLS + gating de la app); si cambian, actualizar aquí.
export const ROL_DESCRIPCIONES: Record<RolUsuario, string> = {
  administrador: 'Todo el sistema: catálogos, usuarios, incidentes y cualquier acción de los demás roles.',
  evaluador_social: 'Hogares, integrantes y solicitudes; evaluación social, hitos e informes sociales.',
  aprobador: 'Aprueba y rechaza solicitudes (incluida la excepción RSH); lee evaluaciones, hitos e informes.',
  bodega_logistica: 'Inventario, proveedores, compras y gestión de entregas.',
  terreno_repartidor: 'Sus entregas asignadas y rutas, con registro del resultado (también offline).',
  finanzas: 'Validación de boletas y registro de pagos de reembolsos.',
  auditor_consulta: 'Solo lectura: auditoría, incidentes y reportes.',
}
