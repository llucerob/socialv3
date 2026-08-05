import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Solicitud, SolicitudConRelaciones, HistorialCambioSolicitud } from './types'

type FilaConRelaciones = Solicitud & {
  grupos_familiares: { direccion: string } | null
  tipos_ayuda: { nombre: string } | null
  personas: { nombres: string; apellidos: string } | null
}

const SELECT_CON_RELACIONES =
  '*, grupos_familiares(direccion), tipos_ayuda(nombre), personas(nombres, apellidos)'

function mapear(fila: FilaConRelaciones): SolicitudConRelaciones {
  const { grupos_familiares, tipos_ayuda, personas, ...solicitud } = fila
  return {
    ...solicitud,
    grupo_familiar_direccion: grupos_familiares?.direccion ?? '',
    tipo_ayuda_nombre: tipos_ayuda?.nombre ?? '',
    persona_nombre: personas ? `${personas.nombres} ${personas.apellidos}` : null,
  }
}

export async function listarSolicitudes(): Promise<SolicitudConRelaciones[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('solicitudes')
    .select(SELECT_CON_RELACIONES)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as unknown as FilaConRelaciones[]).map(mapear)
}

export async function listarSolicitudesDeHogar(
  grupoFamiliarId: string
): Promise<SolicitudConRelaciones[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('solicitudes')
    .select(SELECT_CON_RELACIONES)
    .eq('grupo_familiar_id', grupoFamiliarId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as unknown as FilaConRelaciones[]).map(mapear)
}

export async function obtenerSolicitud(id: string): Promise<SolicitudConRelaciones | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('solicitudes')
    .select(SELECT_CON_RELACIONES)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? mapear(data as unknown as FilaConRelaciones) : null
}

export async function obtenerHistorialSolicitud(id: string): Promise<HistorialCambioSolicitud[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('solicitudes_historial')
    .select('*')
    .eq('solicitud_id', id)
    .order('creado_en', { ascending: false })

  if (error) throw error
  return data as HistorialCambioSolicitud[]
}

// EPIC 02 (US-02.01) — "Solicitudes en evaluación" del dashboard: la cola de
// evaluador_social (y administrador), solicitudes en_evaluacion que
// TODAVÍA NO tienen una evaluación social registrada. El complemento (con
// evaluación ya registrada, para el rol aprobador) se resuelve vía RPC
// porque auditor_consulta también lo necesita y no tiene SELECT sobre
// evaluaciones_sociales — ver listar_solicitudes_pendientes_aprobacion_dashboard
// en la migración de EPIC 02. Acá, en cambio, ambos roles que consumen esta
// función (evaluador_social, administrador) sí tienen SELECT directo sobre
// evaluaciones_sociales, así que no hace falta una función security definer.
export async function listarSolicitudesEnEvaluacionSinEvaluar(): Promise<SolicitudConRelaciones[]> {
  const enEvaluacion = await listarSolicitudesPorEstado('en_evaluacion')
  if (enEvaluacion.length === 0) return []

  const supabase = await createClient()
  const { data: evaluadas, error } = await supabase
    .from('evaluaciones_sociales')
    .select('solicitud_id')
    .in(
      'solicitud_id',
      enEvaluacion.map((s) => s.id)
    )

  if (error) throw error
  const idsEvaluados = new Set((evaluadas ?? []).map((fila) => fila.solicitud_id as string))
  return enEvaluacion.filter((solicitud) => !idsEvaluados.has(solicitud.id))
}

async function listarSolicitudesPorEstado(estado: string): Promise<SolicitudConRelaciones[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('solicitudes')
    .select(SELECT_CON_RELACIONES)
    .eq('estado', estado)
    .order('fecha_solicitud')

  if (error) throw error
  return (data as unknown as FilaConRelaciones[]).map(mapear)
}

// US-08.02: "se muestra si existen ayudas similares recientes" / "el
// sistema advierte posibles duplicidades". Se considera posible duplicado
// otra solicitud del mismo hogar, del mismo tipo de ayuda, que no esté ya
// rechazada o anulada (esas ya no compiten por la misma ayuda).
const ESTADOS_NO_CUENTAN_COMO_DUPLICADO = ['rechazada', 'anulada']

export function detectarPosiblesDuplicados(
  solicitudesDelHogar: SolicitudConRelaciones[],
  solicitudActualId: string,
  tipoAyudaId: string
): SolicitudConRelaciones[] {
  return solicitudesDelHogar.filter(
    (solicitud) =>
      solicitud.id !== solicitudActualId &&
      solicitud.tipo_ayuda_id === tipoAyudaId &&
      !ESTADOS_NO_CUENTAN_COMO_DUPLICADO.includes(solicitud.estado)
  )
}
