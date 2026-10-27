import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ActiveProfile, RolUsuario } from './types'
import { tieneRol } from './roles'

export const verifySession = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return user
})

// Además de requerir sesión, exige rol asignado y estado activo
// (US-01.02, US-01.03: "usuario sin rol válido no opera" / "usuarios inactivos no operan").
export const getProfile = cache(async (): Promise<ActiveProfile> => {
  const user = await verifySession()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nombre, email, roles, estado')
    .eq('id', user.id)
    .single()

  if (!profile || profile.estado !== 'activo' || !profile.roles?.length) {
    redirect('/sin-acceso')
  }

  return profile as ActiveProfile
})

// Gating por rol para páginas/acciones de un módulo de negocio (ej. crear o
// editar un grupo familiar). Redirige en vez de solo ocultar UI: el checkeo
// de render no es una barrera de seguridad (una Server Action es alcanzable
// directamente aunque el formulario esté oculto).
export async function requireRole(roles: readonly RolUsuario[]) {
  const profile = await getProfile()

  if (!tieneRol(profile, roles)) {
    redirect('/sin-permiso')
  }

  return profile
}
