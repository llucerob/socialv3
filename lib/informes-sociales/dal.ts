import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { RolUsuario } from '@/lib/auth/types'
import type { InformeSocial, InformeSocialConNombres } from './types'

// US-23.02: mismo público que hitos/evaluaciones_sociales (CLAUDE.md,
// ROLES_VER_HITOS) — la confidencialidad 'alta' se restringe todavía más
// dentro de este mismo grupo (ver puede_ver_informe_social en la migración).
export const ROLES_VER_INFORMES: RolUsuario[] = ['administrador', 'evaluador_social', 'aprobador']
export const ROLES_REGISTRAR_INFORMES: RolUsuario[] = ['administrador', 'evaluador_social']

type FilaConRelaciones = InformeSocial & {
  personas: { nombres: string; apellidos: string } | null
  solicitudes: { tipos_ayuda: { nombre: string } | null } | null
}

const SELECT_CON_RELACIONES = '*, personas(nombres, apellidos), solicitudes(tipos_ayuda(nombre))'

async function resolverNombres(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filas: FilaConRelaciones[]
): Promise<InformeSocialConNombres[]> {
  const idsUnicos = [...new Set(filas.map((f) => f.creado_por))]
  const nombresPorId = new Map<string, string | null>()
  await Promise.all(
    idsUnicos.map(async (id) => {
      const { data: nombre } = await supabase.rpc('nombre_usuario', { p_user_id: id })
      nombresPorId.set(id, nombre ?? null)
    })
  )

  return filas.map(({ personas, solicitudes, ...informe }) => ({
    ...informe,
    creado_por_nombre: nombresPorId.get(informe.creado_por) ?? null,
    persona_nombre: personas ? `${personas.nombres} ${personas.apellidos}` : null,
    solicitud_tipo_ayuda_nombre: solicitudes?.tipos_ayuda?.nombre ?? null,
  }))
}

// US-23.02: "listado de informes por hogar, ordenado por fecha".
export async function listarInformesSocialesDeHogar(grupoFamiliarId: string): Promise<InformeSocialConNombres[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('informes_sociales')
    .select(SELECT_CON_RELACIONES)
    .eq('grupo_familiar_id', grupoFamiliarId)
    .order('fecha_informe', { ascending: false })

  if (error) throw error
  return resolverNombres(supabase, data as unknown as FilaConRelaciones[])
}

// US-23.03: "la referencia es visible desde ambos lados (informe → caso,
// caso → informe)" — este es el lado "caso → informe", usado en
// solicitudes/[id]/page.tsx.
export async function listarInformesSocialesDeSolicitud(solicitudId: string): Promise<InformeSocialConNombres[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('informes_sociales')
    .select(SELECT_CON_RELACIONES)
    .eq('solicitud_id', solicitudId)
    .order('fecha_informe', { ascending: false })

  if (error) throw error
  return resolverNombres(supabase, data as unknown as FilaConRelaciones[])
}

// "No se puede aprobar sin un informe social asociado" (US-05.05, US-23.01,
// US-25.01) se decide con el total de informes de la solicitud, no con los
// que el rol alcanza a leer: al aprobador no le llegan los de
// confidencialidad 'alta' (puede_ver_informe_social), y eso lo bloqueaba
// aunque el requisito estuviera cumplido. La función solo cuenta, no
// expone contenido.
export async function contarInformesSocialesDeSolicitud(solicitudId: string): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('contar_informes_sociales_de_solicitud', {
    p_solicitud_id: solicitudId,
  })

  if (error) throw error
  return data ?? 0
}
