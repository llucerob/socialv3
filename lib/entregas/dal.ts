import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type {
  Entrega,
  EntregaConContexto,
  FuncionarioTerreno,
  HistorialCambioEntrega,
  EntregaRealizadaDeHogar,
  EntregaLecturaSolicitud,
  EntregaPendienteDashboard,
} from './types'

type FilaConContexto = Omit<Entrega, 'motivo_fallo_nombre'> & {
  motivos_entrega_fallida: { nombre: string } | null
  solicitudes: {
    tipo_ayuda_id: string
    grupo_familiar_id: string
    grupos_familiares: { direccion: string; sector: string; latitud: number | null; longitud: number | null } | null
    tipos_ayuda: { nombre: string; requiere_evidencia: boolean } | null
    personas: { nombres: string; apellidos: string } | null
  } | null
}

// US-19.03: motivos_entrega_fallida(nombre) es un join de UN nivel
// (entregas → motivos_entrega_fallida directo), a diferencia del de
// solicitudes → grupos_familiares/tipos_ayuda/personas (dos niveles) — sí es
// confiable vía PostgREST embebido, así que se resuelve aquí y no en JS.
const SELECT_CON_CONTEXTO =
  '*, motivos_entrega_fallida(nombre), solicitudes(tipo_ayuda_id, grupo_familiar_id, grupos_familiares(direccion, sector, latitud, longitud), tipos_ayuda(nombre, requiere_evidencia), personas(nombres, apellidos))'

// US-12.02: mostrar a quién quedó asignada la entrega ("la asignación queda
// registrada" — de nada sirve si bodega no puede ver el resultado). Mismo
// patrón que documentos/dal.ts: resolver nombre vía RPC (la RLS de profiles
// no deja ver el perfil de otro usuario) para cada id de responsable único
// del lote, evitando N llamadas repetidas para el mismo responsable.
async function resolverResponsables<T extends { responsable_id: string | null }>(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filas: T[]
): Promise<(T & { responsable_nombre: string | null })[]> {
  const idsUnicos = [...new Set(filas.map((f) => f.responsable_id).filter((id): id is string => id !== null))]
  const nombresPorId = new Map<string, string | null>()
  await Promise.all(
    idsUnicos.map(async (id) => {
      const { data: nombre } = await supabase.rpc('nombre_usuario', { p_user_id: id })
      nombresPorId.set(id, nombre ?? null)
    })
  )

  return filas.map((fila) => ({
    ...fila,
    responsable_nombre: fila.responsable_id ? nombresPorId.get(fila.responsable_id) ?? null : null,
  }))
}

function mapearConContexto(fila: FilaConContexto): Omit<EntregaConContexto, 'responsable_nombre'> {
  const { solicitudes, motivos_entrega_fallida, ...entrega } = fila
  return {
    ...entrega,
    motivo_fallo_nombre: motivos_entrega_fallida?.nombre ?? null,
    grupo_familiar_id: solicitudes?.grupo_familiar_id ?? '',
    grupo_familiar_direccion: solicitudes?.grupos_familiares?.direccion ?? '',
    grupo_familiar_sector: solicitudes?.grupos_familiares?.sector ?? '',
    grupo_familiar_latitud: solicitudes?.grupos_familiares?.latitud ?? null,
    grupo_familiar_longitud: solicitudes?.grupos_familiares?.longitud ?? null,
    tipo_ayuda_nombre: solicitudes?.tipos_ayuda?.nombre ?? '',
    tipo_ayuda_requiere_evidencia: solicitudes?.tipos_ayuda?.requiere_evidencia ?? false,
    persona_nombre: solicitudes?.personas
      ? `${solicitudes.personas.nombres} ${solicitudes.personas.apellidos}`
      : null,
  }
}

// US-12.01: gestión general (bodega/administrador) — todas las entregas.
export async function listarEntregas(): Promise<EntregaConContexto[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('entregas')
    .select(SELECT_CON_CONTEXTO)
    .order('created_at', { ascending: false })

  if (error) throw error
  const filas = (data as unknown as FilaConContexto[]).map(mapearConContexto)
  return resolverResponsables(supabase, filas)
}

// US-12.03: "el funcionario ve solo sus entregas". Con un solo rol la RLS
// bastaba (terreno_repartidor solo lee responsable_id = auth.uid()), pero
// con roles múltiples un usuario de terreno que además es de bodega lee
// todas las entregas por RLS, y "Mis entregas", "Rutas" y la caché offline
// le mostrarían las de todos. Por eso el filtro va explícito, salvo para el
// administrador, que sigue viendo todas (verEntregasDeTodos).
export async function listarMisEntregas(
  usuarioId: string,
  verEntregasDeTodos: boolean
): Promise<EntregaConContexto[]> {
  const supabase = await createClient()
  let consulta = supabase
    .from('entregas')
    .select(SELECT_CON_CONTEXTO)
    // MR-06: una entrega en local se registra ya realizada en el
    // Departamento Social; no es parte del trabajo de terreno.
    .eq('modalidad', 'domicilio')
    .order('fecha_programada', { ascending: true, nullsFirst: false })
  if (!verEntregasDeTodos) {
    consulta = consulta.eq('responsable_id', usuarioId)
  }
  const { data, error } = await consulta

  if (error) throw error
  const filas = (data as unknown as FilaConContexto[]).map(mapearConContexto)
  return resolverResponsables(supabase, filas)
}

export async function obtenerEntrega(id: string): Promise<EntregaConContexto | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('entregas')
    .select(SELECT_CON_CONTEXTO)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const [conResponsable] = await resolverResponsables(supabase, [
    mapearConContexto(data as unknown as FilaConContexto),
  ])
  return conResponsable
}

export async function obtenerEntregaDeSolicitud(solicitudId: string): Promise<Entrega | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('entregas')
    .select('*, motivos_entrega_fallida(nombre)')
    .eq('solicitud_id', solicitudId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const { motivos_entrega_fallida, ...entrega } = data as Omit<Entrega, 'motivo_fallo_nombre'> & {
    motivos_entrega_fallida: { nombre: string } | null
  }
  const entregaConMotivo: Entrega = { ...entrega, motivo_fallo_nombre: motivos_entrega_fallida?.nombre ?? null }

  const [conResponsable] = await resolverResponsables(supabase, [entregaConMotivo])
  return conResponsable
}

// US-13.01: filtro por sector para agrupar entregas. Se filtra en JS sobre
// el resultado ya embebido (grupo_familiar_sector viene de un join de dos
// niveles — entregas → solicitudes → grupos_familiares — que PostgREST no
// soporta filtrar de forma confiable en un solo request); la RLS de
// listarEntregas() ya limita el resultado según el rol de quien llama.
export async function listarEntregasDeSector(sector: string): Promise<EntregaConContexto[]> {
  const entregas = await listarEntregas()
  return entregas.filter((entrega) => entrega.grupo_familiar_sector === sector)
}

// US-12.02: lista de responsables asignables.
export async function listarFuncionariosTerreno(): Promise<FuncionarioTerreno[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('listar_funcionarios_terreno')
  if (error) throw error
  return data as FuncionarioTerreno[]
}

export async function obtenerHistorialEntrega(entregaId: string): Promise<HistorialCambioEntrega[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('entregas_historial')
    .select('*')
    .eq('entrega_id', entregaId)
    .order('creado_en', { ascending: false })

  if (error) throw error
  return data as HistorialCambioEntrega[]
}

// EPIC 12 — US-03.04: "ayudas entregadas" en la ficha del hogar, para roles
// que no tienen SELECT directo sobre `entregas` (todo ROLES_VER_HOGAR salvo
// administrador/bodega_logistica). Vía RPC security definer, no la tabla
// directa — ver 20260813000001_lectura_entregas_otros_roles.sql.
export async function listarEntregasRealizadasDeHogar(
  grupoFamiliarId: string
): Promise<EntregaRealizadaDeHogar[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('listar_entregas_realizadas_de_hogar', {
    p_grupo_familiar_id: grupoFamiliarId,
  })

  if (error) throw new Error(`Error al consultar las ayudas entregadas del hogar: ${error.message}`)
  return data ?? []
}

// EPIC 12 — vista de solo lectura de la entrega para quien puede ver la
// solicitud pero no gestionarla (evaluador_social, aprobador, finanzas,
// auditor_consulta). administrador/bodega_logistica siguen usando
// obtenerEntregaDeSolicitud (RLS directa), que además trae lo necesario
// para las acciones de gestión.
export async function obtenerEntregaLecturaDeSolicitud(
  solicitudId: string
): Promise<EntregaLecturaSolicitud | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('obtener_entrega_lectura_de_solicitud', {
    p_solicitud_id: solicitudId,
  })

  if (error) throw new Error(`Error al consultar la entrega de la solicitud: ${error.message}`)
  return data?.[0] ?? null
}

// EPIC 12 — tarjeta "Entregas pendientes" del dashboard (lib/dashboard/sections.ts).
export async function listarEntregasPendientesParaDashboard(): Promise<EntregaPendienteDashboard[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('listar_entregas_pendientes_para_dashboard')

  if (error) throw new Error(`Error al consultar las entregas pendientes: ${error.message}`)
  return data ?? []
}
