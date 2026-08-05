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
  rol: RolUsuario | null
  estado: EstadoUsuario
}

// Perfil ya validado por el DAL (rol asignado + estado activo).
export type ActiveProfile = Omit<Profile, 'rol'> & { rol: RolUsuario }

export const ROL_LABELS: Record<RolUsuario, string> = {
  administrador: 'Administrador',
  evaluador_social: 'Evaluador social',
  aprobador: 'Aprobador',
  bodega_logistica: 'Bodega / logística',
  terreno_repartidor: 'Terreno / repartidor',
  finanzas: 'Finanzas',
  auditor_consulta: 'Auditor / consulta',
}
