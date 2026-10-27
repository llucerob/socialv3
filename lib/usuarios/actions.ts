'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/dal'
import { LARGO_MINIMO_CONTRASENA, type RolUsuario, type EstadoUsuario } from '@/lib/auth/types'
import { ROLES_ORDENADOS } from '@/lib/auth/roles'

const ROLES_GESTION_USUARIOS = ['administrador'] as const

const ROLES_VALIDOS = ROLES_ORDENADOS

export type UsuarioFormState = { error?: string } | undefined

export type CrearUsuarioFormState =
  | {
      error?: string
      // Se devuelven para no borrar lo tipeado si el servidor rechaza el
      // formulario (la contraseña no se devuelve nunca).
      valores?: { nombre: string; email: string; roles: string[] }
    }
  | undefined

// MR-02: el administrador crea la cuenta desde la plataforma. Crear un
// usuario de Auth exige la clave de servicio (createAdminClient); el perfil
// lo crea el trigger handle_new_user() sin roles, y los roles se asignan
// después con la sesión del administrador (RLS de profiles), para que
// log_profile_cambio deje el cambio en profiles_historial a su nombre.
export async function crearUsuario(
  _prevState: CrearUsuarioFormState,
  formData: FormData
): Promise<CrearUsuarioFormState> {
  await requireRole([...ROLES_GESTION_USUARIOS])

  const nombre = formData.get('nombre')?.toString().trim() ?? ''
  const email = formData.get('email')?.toString().trim().toLowerCase() ?? ''
  const contrasena = formData.get('contrasena')?.toString() ?? ''
  const confirmacion = formData.get('confirmacion')?.toString() ?? ''
  const marcados = formData.getAll('roles').map((valor) => valor.toString())
  const valores = { nombre, email, roles: marcados }

  if (!nombre || !email) {
    return { error: 'Ingresa el nombre y el email.', valores }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'El email no es válido.', valores }
  }
  if (contrasena.length < LARGO_MINIMO_CONTRASENA) {
    return { error: `La contraseña debe tener al menos ${LARGO_MINIMO_CONTRASENA} caracteres.`, valores }
  }
  if (contrasena !== confirmacion) {
    return { error: 'La contraseña y su confirmación no coinciden.', valores }
  }
  if (marcados.some((rol) => !ROLES_VALIDOS.includes(rol as RolUsuario))) {
    return { error: 'Selecciona solo roles válidos.', valores }
  }
  const roles = ROLES_VALIDOS.filter((rol) => marcados.includes(rol))
  if (roles.length === 0) {
    return { error: 'Asigna al menos un rol: un usuario sin roles no puede operar.', valores }
  }

  const { data, error } = await createAdminClient().auth.admin.createUser({
    email,
    password: contrasena,
    // Cuenta institucional creada por el administrador: no se envía correo
    // de confirmación, queda lista para iniciar sesión.
    email_confirm: true,
    user_metadata: { nombre },
  })

  if (error || !data.user) {
    if (error?.code === 'email_exists') {
      return { error: 'Ya existe un usuario con ese email.', valores }
    }
    return { error: 'No se pudo crear el usuario.', valores }
  }

  const supabase = await createClient()
  const { error: errorRoles } = await supabase
    .from('profiles')
    .update({ roles, estado: 'activo' satisfies EstadoUsuario })
    .eq('id', data.user.id)

  revalidatePath('/admin/usuarios')
  if (errorRoles) {
    // La cuenta ya existe: se informa en vez de reintentar, y los roles se
    // pueden asignar desde la ficha del usuario.
    return {
      error: 'El usuario se creó, pero no se pudieron asignar los roles. Asígnalos desde su ficha en Usuarios.',
    }
  }

  redirect(`/admin/usuarios/${data.user.id}`)
}

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
