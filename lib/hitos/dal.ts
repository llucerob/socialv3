import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/dal'
import type { ActiveProfile, RolUsuario } from '@/lib/auth/types'
import type { Hito, HitoConNombres } from './types'

// US-22.03: "hitos e informes sociales son datos sensibles" (CLAUDE.md) —
// mismo conjunto de roles que evaluaciones_sociales/decisiones_solicitud.
export const ROLES_VER_HITOS: RolUsuario[] = ['administrador', 'evaluador_social', 'aprobador']
export const ROLES_REGISTRAR_HITOS: RolUsuario[] = ['administrador', 'evaluador_social']

// US-22.03, criterio "el intento de acceso no autorizado queda registrado en
// auditoría". La RLS de Postgres bloquea la lectura de forma silenciosa (un
// select sin permiso simplemente no devuelve filas, no hay un evento que
// "loguear" desde dentro de la política) — por eso el registro ocurre acá,
// en el gate de la aplicación, antes de redirigir. Esto cubre el acceso vía
// la interfaz (todas las rutas de hitos pasan por este gate); un acceso
// directo por REST bypaseando la app queda bloqueado por RLS pero no
// auditado individualmente — mismo límite que el resto de RLS del sistema,
// no específico de hitos.
export async function requireRoleHitos(
  roles: readonly RolUsuario[],
  ruta: string,
  grupoFamiliarId?: string
): Promise<ActiveProfile> {
  const profile = await getProfile()

  if (!roles.includes(profile.rol)) {
    const supabase = await createClient()
    await supabase.from('hitos_accesos_denegados').insert({
      rol_en_intento: profile.rol,
      grupo_familiar_id: grupoFamiliarId ?? null,
      ruta,
    })
    redirect('/sin-permiso')
  }

  return profile
}

export async function listarHitosDeHogar(grupoFamiliarId: string): Promise<HitoConNombres[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hitos')
    .select('*, personas(nombres, apellidos)')
    .eq('grupo_familiar_id', grupoFamiliarId)
    .order('fecha_hito', { ascending: false })

  if (error) throw error

  const hitos = data as (Hito & { personas: { nombres: string; apellidos: string } | null })[]
  const idsUnicos = [...new Set(hitos.map((h) => h.creado_por))]

  const nombresPorId = new Map<string, string | null>()
  await Promise.all(
    idsUnicos.map(async (id) => {
      const { data: nombre } = await supabase.rpc('nombre_usuario', { p_user_id: id })
      nombresPorId.set(id, nombre ?? null)
    })
  )

  return hitos.map(({ personas, ...hito }) => ({
    ...hito,
    creado_por_nombre: nombresPorId.get(hito.creado_por) ?? null,
    persona_nombre: personas ? `${personas.nombres} ${personas.apellidos}` : null,
  }))
}
