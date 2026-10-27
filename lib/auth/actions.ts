'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile, verifySession } from '@/lib/auth/dal'
import { LARGO_MINIMO_CONTRASENA } from '@/lib/auth/types'

export type LoginState = { error?: string } | undefined

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get('email')?.toString().trim() ?? ''
  const password = formData.get('password')?.toString() ?? ''

  if (!email || !password) {
    return { error: 'Ingresa tu email y tu contraseña.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Credenciales inválidas.' }
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export type CambiarContrasenaState = { error?: string; ok?: boolean } | undefined

// MR-03: cada usuario cambia su propia contraseña. Siempre actúa sobre la
// sesión actual (no recibe un id), y exige la contraseña actual para que una
// sesión olvidada abierta no baste para tomar la cuenta.
export async function cambiarMiContrasena(
  _prevState: CambiarContrasenaState,
  formData: FormData
): Promise<CambiarContrasenaState> {
  await getProfile()
  const user = await verifySession()

  const actual = formData.get('actual')?.toString() ?? ''
  const nueva = formData.get('nueva')?.toString() ?? ''
  const confirmacion = formData.get('confirmacion')?.toString() ?? ''

  if (!actual || !nueva) {
    return { error: 'Completa la contraseña actual y la nueva.' }
  }
  if (nueva.length < LARGO_MINIMO_CONTRASENA) {
    return { error: `La nueva contraseña debe tener al menos ${LARGO_MINIMO_CONTRASENA} caracteres.` }
  }
  if (nueva !== confirmacion) {
    return { error: 'La nueva contraseña y su confirmación no coinciden.' }
  }
  if (nueva === actual) {
    return { error: 'La nueva contraseña debe ser distinta de la actual.' }
  }

  const supabase = await createClient()
  const { error: errorActual } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: actual,
  })
  if (errorActual) {
    return { error: 'La contraseña actual no es correcta.' }
  }

  const { error } = await supabase.auth.updateUser({ password: nueva })
  if (error) {
    return { error: 'No se pudo cambiar la contraseña.' }
  }

  return { ok: true }
}
