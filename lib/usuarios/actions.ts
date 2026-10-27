'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'
import type { RolUsuario, EstadoUsuario } from '@/lib/auth/types'
import { ROLES_ORDENADOS } from '@/lib/auth/roles'

const ROLES_GESTION_USUARIOS = ['administrador'] as const

const ROLES_VALIDOS = ROLES_ORDENADOS

export type UsuarioFormState = { error?: string } | undefined

// US-19.01: "se puede cambiar rol". Un usuario puede tener varios roles
// (equipo chico: la misma persona evalúa y aprueba, o aprueba y lleva
// bodega). El administrador puede ajustar también sus propios roles, pero
// no quitarse "administrador" a sí mismo: eso podría dejar al sistema sin
// ningún administrador activo (bootstrap_admin() solo actúa al crear la
// cuenta, no restaura un admin existente). El cambio queda en
// profiles_historial vía log_profile_cambio.
export async function cambiarRolesUsuario(
  id: string,
  _prevState: UsuarioFormState,
  formData: FormData
): Promise<UsuarioFormState> {
  const profile = await requireRole([...ROLES_GESTION_USUARIOS])

  const marcados = formData.getAll('roles').map((valor) => valor.toString())
  if (marcados.some((rol) => !ROLES_VALIDOS.includes(rol as RolUsuario))) {
    return { error: 'Selecciona solo roles válidos.' }
  }
  // Orden canónico, así el historial no registra un "cambio" que solo
  // reordena los mismos roles.
  const roles = ROLES_VALIDOS.filter((rol) => marcados.includes(rol))

  if (id === profile.id && !roles.includes('administrador')) {
    return { error: 'No puedes quitarte el rol de administrador a ti mismo.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ roles }).eq('id', id)

  if (error) {
    return { error: 'No se pudieron cambiar los roles del usuario.' }
  }

  revalidatePath(`/admin/usuarios/${id}`)
  revalidatePath('/admin/usuarios')
  // Si el administrador cambió sus propios roles, su menú cambia de
  // inmediato.
  if (id === profile.id) revalidatePath('/', 'layout')
}

// US-19.01: "se puede activar o desactivar usuario". Un administrador no
// puede desactivarse a sí mismo, por la misma razón que no puede quitarse
// el rol de administrador (ver cambiarRolesUsuario).
export async function cambiarEstadoUsuario(
  id: string,
  _prevState: UsuarioFormState,
  formData: FormData
): Promise<UsuarioFormState> {
  const profile = await requireRole([...ROLES_GESTION_USUARIOS])

  if (id === profile.id) {
    return { error: 'No puedes activar o desactivar tu propia cuenta.' }
  }

  const nuevoEstado = formData.get('estado')?.toString()
  if (nuevoEstado !== 'activo' && nuevoEstado !== 'inactivo') {
    return { error: 'Estado inválido.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ estado: nuevoEstado satisfies EstadoUsuario })
    .eq('id', id)

  if (error) {
    return { error: 'No se pudo cambiar el estado del usuario.' }
  }

  revalidatePath(`/admin/usuarios/${id}`)
  revalidatePath('/admin/usuarios')
}
