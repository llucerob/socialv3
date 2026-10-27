import type { RolUsuario, EstadoUsuario } from '@/lib/auth/types'

// US-19.01: "se listan usuarios" — subconjunto de columnas de `profiles`
// permitido por su propia RLS (id, nombre, email, roles, estado ya son
// legibles por administrador; no se expone nada nuevo).
export type Usuario = {
  id: string
  nombre: string
  email: string
  roles: RolUsuario[]
  estado: EstadoUsuario
  created_at: string
}

export type HistorialCambioUsuario = {
  id: string
  profile_id: string
  campo: string
  valor_anterior: string | null
  valor_nuevo: string | null
  usuario_id: string | null
  creado_en: string
}
