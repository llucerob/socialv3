export type RolUsuario =
  | 'administrador'
  | 'evaluador_social'
  | 'aprobador'
  | 'bodega_logistica'
  | 'terreno_repartidor'
  | 'finanzas'
  | 'auditor_consulta'

export type EstadoUsuario = 'activo' | 'inactivo'

export type Profile = {
  id: string
  nombre: string
  email: string
  // Un usuario puede tener varios roles (equipo chico: la misma persona
  // evalúa y aprueba, o aprueba y lleva bodega). Cada permiso se concede si
  // tiene alguno de los roles que lo habilitan — ver tieneRol().
  roles: RolUsuario[]
  estado: EstadoUsuario
}

// Perfil ya validado por el DAL (al menos un rol + estado activo).
export type ActiveProfile = Profile

export const ROL_LABELS: Record<RolUsuario, string> = {
  administrador: 'Administrador',
  evaluador_social: 'Evaluador social',
  aprobador: 'Aprobador',
  bodega_logistica: 'Bodega / logística',
  terreno_repartidor: 'Terreno / repartidor',
  finanzas: 'Finanzas',
  auditor_consulta: 'Auditor / consulta',
}
