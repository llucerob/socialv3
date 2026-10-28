import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { obtenerEntregaAsignadaAlUsuario, aplicarResultadoEntregaSync } from '@/lib/entregas/registro'
import { obtenerSolicitud } from '@/lib/solicitudes/dal'
import { obtenerTipoAyuda } from '@/lib/ayudas/dal'
import { tieneSalidaStock } from '@/lib/inventario/dal'
import { MENSAJE_SIN_SALIDA_STOCK } from '@/lib/entregas/types'
import { listarDocumentosDeSolicitud } from '@/lib/documentos/dal'
import { subirDocumentoSolicitud } from '@/lib/documentos/actions'
import { tieneRol } from '@/lib/auth/roles'

const ROLES_TERRENO = ['administrador', 'terreno_repartidor'] as const

// EPIC 27 (US-27.03/US-27.04/US-27.05) — equivalente de
// registrarEntregaRealizada (lib/entregas/actions.ts) pero como ruta API
// fetcheable/reintentable desde la cola de sincronización offline (una
// Server Action no se puede reproducir desde una cola — ver el comentario
// de app/api/rutas/calcular-orden/route.ts para el mismo precedente). Recibe
// `capturado_en`: el momento real del intento (offline u online), no el de
// esta petición — así el historial no se distorsiona con la hora de sync.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireRole([...ROLES_TERRENO])
  const { id: entregaId } = await params

  const formData = await request.formData()
  const receptorNombre = formData.get('receptor_nombre')?.toString().trim() ?? ''
  const receptorRelacion = formData.get('receptor_relacion')?.toString().trim() ?? ''
  const observacion = formData.get('observacion')?.toString().trim() ?? ''
  const fechaHora = formData.get('fecha_hora')?.toString().trim() ?? ''
  const latitudRaw = formData.get('latitud')?.toString().trim() ?? ''
  const longitudRaw = formData.get('longitud')?.toString().trim() ?? ''
  const capturadoEn = formData.get('capturado_en')?.toString().trim() ?? ''

  if (!receptorNombre) {
    return Response.json({ error: 'El nombre de quien recibe es obligatorio.' }, { status: 400 })
  }
  if (!capturadoEn) {
    return Response.json({ error: 'Falta la fecha de captura original.' }, { status: 400 })
  }

  const entrega = await obtenerEntregaAsignadaAlUsuario(entregaId, profile.id, tieneRol(profile, ['administrador']))
  if (!entrega) {
    return Response.json({ error: 'Entrega no encontrada o no asignada a tu usuario.' }, { status: 404 })
  }

  // MR-07: antes de subir la evidencia de una entrega que se va a rechazar.
  if (entrega.estado === 'pendiente' && !(await tieneSalidaStock(entrega.solicitud_id))) {
    return Response.json({ error: MENSAJE_SIN_SALIDA_STOCK }, { status: 400 })
  }

  const solicitud = await obtenerSolicitud(entrega.solicitud_id)
  const tipoAyuda = solicitud ? await obtenerTipoAyuda(solicitud.tipo_ayuda_id) : null

  const archivo = formData.get('archivo')
  const tieneArchivo = archivo instanceof File && archivo.size > 0

  if (tipoAyuda?.requiere_evidencia && !tieneArchivo) {
    const documentosExistentes = await listarDocumentosDeSolicitud(entrega.solicitud_id)
    const tieneEvidenciaPrevia = documentosExistentes.some((d) => d.tipo_documento === 'fotografia')
    if (!tieneEvidenciaPrevia) {
      return Response.json({ error: 'Esta ayuda requiere adjuntar evidencia fotográfica.' }, { status: 400 })
    }
  }

  if (tieneArchivo) {
    const resultadoSubida = await subirDocumentoSolicitud(entrega.solicitud_id, undefined, formData)
    if (resultadoSubida?.error) {
      return Response.json({ error: resultadoSubida.error }, { status: 400 })
    }
  }

  const supabase = await createClient()
  const resultado = await aplicarResultadoEntregaSync(
    supabase,
    entrega,
    {
      estado: 'realizada',
      fecha_hora_entrega: fechaHora ? new Date(fechaHora).toISOString() : capturadoEn,
      receptor_nombre: receptorNombre,
      receptor_relacion: receptorRelacion || null,
      observacion_entrega: observacion || null,
      latitud: latitudRaw ? Number(latitudRaw) : null,
      longitud: longitudRaw ? Number(longitudRaw) : null,
    },
    capturadoEn
  )

  if (!resultado.ok) {
    return Response.json(
      { error: resultado.mensaje, conflicto: resultado.conflicto },
      { status: resultado.conflicto ? 409 : 500 }
    )
  }

  await supabase.rpc('marcar_solicitud_entregada', { p_solicitud_id: entrega.solicitud_id })

  revalidatePath(`/mis-entregas/${entregaId}`)
  revalidatePath('/mis-entregas')
  revalidatePath(`/solicitudes/${entrega.solicitud_id}`)

  return Response.json({ ok: true })
}
