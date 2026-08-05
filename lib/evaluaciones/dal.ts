import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { EvaluacionSocial, EvaluacionSocialConNombre } from './types'

// US-08.01: "se registra fecha y usuario evaluador". El nombre se resuelve
// vía RPC (nombre_usuario) porque la RLS de profiles no deja hacer un join
// directo salvo que el evaluador sea uno mismo o admin (ver migración).
export async function listarEvaluacionesDeSolicitud(
  solicitudId: string
): Promise<EvaluacionSocialConNombre[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('evaluaciones_sociales')
    .select('*')
    .eq('solicitud_id', solicitudId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const evaluaciones = data as EvaluacionSocial[]
  const idsUnicos = [...new Set(evaluaciones.map((e) => e.evaluador_id))]

  const nombresPorId = new Map<string, string | null>()
  await Promise.all(
    idsUnicos.map(async (id) => {
      const { data: nombre } = await supabase.rpc('nombre_usuario', { p_user_id: id })
      nombresPorId.set(id, nombre ?? null)
    })
  )

  return evaluaciones.map((evaluacion) => ({
    ...evaluacion,
    evaluador_nombre: nombresPorId.get(evaluacion.evaluador_id) ?? null,
  }))
}
