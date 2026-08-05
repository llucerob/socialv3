import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { DecisionSolicitud, DecisionSolicitudConNombre } from './types'

// US-09.01/09.02: "la decisión queda auditada". El nombre se resuelve vía
// RPC (nombre_usuario, creada en EPIC 08) porque la RLS de profiles no deja
// hacer join directo salvo que sea el propio aprobador o un admin.
export async function obtenerDecisionDeSolicitud(
  solicitudId: string
): Promise<DecisionSolicitudConNombre | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('decisiones_solicitud')
    .select('*')
    .eq('solicitud_id', solicitudId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const decision = data as DecisionSolicitud
  const { data: nombre } = await supabase.rpc('nombre_usuario', {
    p_user_id: decision.aprobador_id,
  })

  return { ...decision, aprobador_nombre: nombre ?? null }
}
