import { notFound, redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { obtenerSolicitud } from '@/lib/solicitudes/dal'
import { actualizarSolicitud } from '@/lib/solicitudes/actions'
import { listarIntegrantesActivos, obtenerPersona } from '@/lib/personas/dal'
import { listarTiposAyudaActivos, obtenerTipoAyuda } from '@/lib/ayudas/dal'
import type { EstadoSolicitud } from '@/lib/solicitudes/types'
import { SolicitudForm } from '../../solicitud-form'

const ESTADOS_EDITABLES: EstadoSolicitud[] = ['borrador', 'ingresada']

export default async function EditarSolicitudPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireRole(['administrador', 'evaluador_social'])

  const solicitud = await obtenerSolicitud(id)
  if (!solicitud) {
    notFound()
  }

  if (!ESTADOS_EDITABLES.includes(solicitud.estado)) {
    redirect(`/solicitudes/${id}`)
  }

  const [tiposAyudaActivos, personasActivasList] = await Promise.all([
    listarTiposAyudaActivos(),
    listarIntegrantesActivos(solicitud.grupo_familiar_id),
  ])

  // El tipo de ayuda o la persona beneficiaria actuales de la solicitud
  // pueden haberse desactivado después de crearla (US-06.03 / US-04.03). Si
  // no se incluyen igual en las opciones, el <select> pierde la selección
  // silenciosamente al editar.
  let tiposAyuda = tiposAyudaActivos
  if (!tiposAyuda.some((tipo) => tipo.id === solicitud.tipo_ayuda_id)) {
    const tipoActual = await obtenerTipoAyuda(solicitud.tipo_ayuda_id)
    if (tipoActual) {
      tiposAyuda = [...tiposAyuda, tipoActual]
    }
  }

  let personasActivas = personasActivasList
  if (
    solicitud.persona_id &&
    !personasActivas.some((persona) => persona.id === solicitud.persona_id)
  ) {
    const personaActual = await obtenerPersona(solicitud.persona_id)
    if (personaActual) {
      personasActivas = [...personasActivas, personaActual]
    }
  }

  const actualizarConId = actualizarSolicitud.bind(null, id)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text-primary">Editar solicitud</h1>
      <SolicitudForm
        action={actualizarConId}
        tiposAyuda={tiposAyuda}
        personasActivas={personasActivas}
        defaultValues={solicitud}
        submitLabel="Guardar cambios"
      />
    </div>
  )
}
