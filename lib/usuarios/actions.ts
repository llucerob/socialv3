'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'
import type { RolUsuario, EstadoUsuario } from '@/lib/auth/types'

const ROLES_GESTION_USUARIOS = ['administrador'] as const

const ROLES_VALIDOS: RolUsuario[] = [
  'administrador',
  'evaluador_social',
  'aprobador',
  'bodega_logistica',
  'terreno_repartidor',
  'finanzas',
  'auditor_consulta',
]

export type UsuarioFormState = { error?: string } | undefined

// US-19.01: "se puede cambiar rol". No se permite que un administrador se
// cambie el rol a sí mismo — a diferencia del resto de catálogos de este
// EPIC, aquí un error de este tipo puede dejar al sistema sin ningún
// administrador activo (bootstrap_admin() solo actúa en la creación de la
// cuenta, no restaura un admin existente). No es un criterio de aceptación
// explícito de la historia, pero es la misma clase de salvaguarda que ya
// impide, por ejemplo, aprobar un reembolso por sobre su tope: una regla de
// negocio de sentido común, no una validación de un caso que no puede pasar.
export async function cambiarRolUsuario(
  id: string,
  _prevState: UsuarioFormState,
  formData: FormData
): Promise<UsuarioFormState> {
  const profile = await requireRole([...ROLES_GESTION_USUARIOS])

  if (id === profile.id) {
    return { error: 'No puedes cambiar tu propio rol.' }
  }

  const nuevoRol = formData.get('rol')?.toString() ?? ''
  if (!ROLES_VALIDOS.includes(nuevoRol as RolUsuario)) {
    return { error: 'Selecciona un rol válido.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ rol: nuevoRol as RolUsuario })
    .eq('id', id)

  if (error) {
    return { error: 'No se pudo cambiar el rol del usuario.' }
  }

  revalidatePath(`/admin/usuarios/${id}`)
  revalidatePath('/admin/usuarios')
}

// US-19.01: "se puede activar o desactivar usuario". Mismo bloqueo de
// autoedición que cambiarRolUsuario, y por la misma razón: un administrador
// no puede desactivarse a sí mismo.
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
