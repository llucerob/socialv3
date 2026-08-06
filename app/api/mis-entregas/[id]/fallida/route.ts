import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { obtenerEntregaAsignadaAlUsuario, aplicarResultadoEntregaSync } from '@/lib/entregas/registro'
import { obtenerMotivoEntregaFallida } from '@/lib/motivos-entrega/dal'

const ROLES_TERRENO = ['administrador', 'terreno_repartidor'] as const

// EPIC 27 — equivalente offline-fetcheable de registrarEntregaFallida (ver
// el comentario de ../realizada/route.ts para el porqué de esta ruta
// paralela a la Server Action).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireRole([...ROLES_TERRENO])
  const { id: entregaId } = await params

  const formData = await request.formData()
  const motivoFallo = formData.get('motivo_fallo')?.toString().trim() ?? ''
  const observacion = formData.get('observacion')?.toString().trim() ?? ''
  const capturadoEn = formData.get('capturado_en')?.toString().trim() ?? ''

  if (!capturadoEn) {
    return Response.json({ error: 'Falta la fecha de captura original.' }, { status: 400 })
  }

  const motivo = motivoFallo ? await obtenerMotivoEntregaFallida(motivoFallo) : null
  if (!motivo || motivo.estado !== 'activo') {
    return Response.json({ error: 'Selecciona un motivo válido.' }, { status: 400 })
  }

  const entrega = await obtenerEntregaAsignadaAlUsuario(entregaId, profile.id, profile.rol === 'administrador')
  if (!entrega) {
    return Response.json({ error: 'Entrega no encontrada o no asignada a tu usuario.' }, { status: 404 })
  }

  const supabase = await createClient()
  const resultado = await aplicarResultadoEntregaSync(
    supabase,
    entrega,
    { estado: 'fallida', motivo_fallo: motivoFallo, observacion_fallo: observacion || null },
    capturadoEn
  )

  if (!resultado.ok) {
    return Response.json(
      { error: resultado.mensaje, conflicto: resultado.conflicto },
      { status: resultado.conflicto ? 409 : 500 }
    )
  }

  revalidatePath(`/mis-entregas/${entregaId}`)
  revalidatePath('/mis-entregas')
  revalidatePath(`/solicitudes/${entrega.solicitud_id}`)

  return Response.json({ ok: true })
}
