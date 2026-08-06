import 'server-only'
import { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

// Compartido entre la Server Action online (lib/entregas/actions.ts) y las
// rutas API del camino offline (EPIC 27, app/api/mis-entregas/[id]/*) — antes
// vivía como función privada dentro de actions.ts; se extrae para que ambos
// caminos apliquen exactamente la misma regla de "es tu entrega asignada",
// en vez de reimplementarla dos veces.
export async function obtenerEntregaAsignadaAlUsuario(entregaId: string, usuarioId: string, esAdmin: boolean) {
  const supabase = await createClient()
  const { data: entrega, error } = await supabase
    .from('entregas')
    .select('id, estado, solicitud_id, responsable_id, capturado_en, updated_at')
    .eq('id', entregaId)
    .maybeSingle()

  if (error || !entrega) return null
  if (!esAdmin && entrega.responsable_id !== usuarioId) return null
  return entrega
}

type EntregaAsignada = NonNullable<Awaited<ReturnType<typeof obtenerEntregaAsignadaAlUsuario>>>

export type ResultadoSyncEntrega =
  | { ok: true }
  | { ok: false; conflicto: boolean; mensaje: string }

// EPIC 27 (US-27.03/US-27.05/US-27.07) — aplica el resultado de una entrega
// (realizada o fallida) llegado desde la cola de sincronización offline.
// A diferencia de la Server Action online (lib/entregas/actions.ts), este
// camino puede recibir una escritura para una entrega que YA NO está
// 'pendiente' — porque se resolvió por otra vía mientras el dispositivo
// estaba desconectado (el mismo dispositivo reintentando, u otra sesión).
// Política US-27.07: "última escritura por fecha de captura gana"; todo
// conflicto (se aplique o se descarte) queda en entregas_historial vía
// registrar_conflicto_sync_entrega, indicando qué versión se descartó.
export async function aplicarResultadoEntregaSync(
  supabase: SupabaseServerClient,
  entrega: EntregaAsignada,
  campos: Record<string, unknown>,
  capturadoEn: string
): Promise<ResultadoSyncEntrega> {
  if (entrega.estado === 'pendiente') {
    const { error } = await supabase
      .from('entregas')
      .update({ ...campos, capturado_en: capturadoEn })
      .eq('id', entrega.id)

    if (error) {
      return { ok: false, conflicto: false, mensaje: 'No se pudo registrar la entrega.' }
    }
    return { ok: true }
  }

  // La entrega ya no está pendiente: esto es un conflicto de sincronización.
  const capturaVigente = entrega.capturado_en ?? entrega.updated_at
  const entrante = new Date(capturadoEn).getTime()
  const vigente = new Date(capturaVigente).getTime()

  if (entrante > vigente) {
    // La captura entrante es más reciente: gana, se sobreescribe.
    const { data: valoresAnteriores } = await supabase
      .from('entregas')
      .select('estado, receptor_nombre, motivo_fallo, observacion_entrega, observacion_fallo')
      .eq('id', entrega.id)
      .maybeSingle()

    const { error } = await supabase
      .from('entregas')
      .update({ ...campos, capturado_en: capturadoEn })
      .eq('id', entrega.id)

    if (error) {
      return { ok: false, conflicto: true, mensaje: 'No se pudo aplicar la sincronización.' }
    }

    await supabase.rpc('registrar_conflicto_sync_entrega', {
      p_entrega_id: entrega.id,
      p_campo: 'sync_conflicto_resuelto',
      p_valor_anterior: JSON.stringify(valoresAnteriores ?? {}),
      p_valor_nuevo: JSON.stringify({ ...campos, capturado_en: capturadoEn }),
    })

    return { ok: true }
  }

  // La captura entrante es igual o más antigua que lo ya guardado: se
  // descarta, sin bloquear ni perder el registro de auditoría.
  await supabase.rpc('registrar_conflicto_sync_entrega', {
    p_entrega_id: entrega.id,
    p_campo: 'sync_conflicto_descartado',
    p_valor_anterior: JSON.stringify({ estado: entrega.estado, capturado_en: capturaVigente }),
    p_valor_nuevo: JSON.stringify({ ...campos, capturado_en: capturadoEn }),
  })

  return {
    ok: false,
    conflicto: true,
    mensaje: 'Esta entrega ya fue registrada con una captura más reciente. Se descartó este envío.',
  }
}
