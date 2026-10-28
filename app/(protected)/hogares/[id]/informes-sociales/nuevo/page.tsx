import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { obtenerGrupoFamiliar } from '@/lib/hogares/dal'
import { listarIntegrantes } from '@/lib/personas/dal'
import { listarSolicitudesDeHogar } from '@/lib/solicitudes/dal'
import { ROLES_REGISTRAR_INFORMES } from '@/lib/informes-sociales/dal'
import { crearInformeSocial } from '@/lib/informes-sociales/actions'
import { InformeSocialForm } from '../../informe-social-form'
import { BannerSensible } from '@/components/ui/BannerSensible'

// US-23.01: "como asistente social, quiero registrar un informe social
// estructurado". US-05.05/US-23.03: si se llega desde una solicitud sin
// informe todavía (?solicitud_id=...), queda preseleccionada y fija.
export default async function NuevoInformeSocialPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ solicitud_id?: string }>
}) {
  const { id } = await params
  const { solicitud_id: solicitudPreseleccionada } = await searchParams
  await requireRole([...ROLES_REGISTRAR_INFORMES])

  const hogar = await obtenerGrupoFamiliar(id)
  if (!hogar) {
    notFound()
  }

  const integrantes = await listarIntegrantes(id)
  const solicitudes = await listarSolicitudesDeHogar(id)
  const registrarConHogar = crearInformeSocial.bind(null, id)

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-brand-800 p-6">
        <h1 className="text-2xl font-semibold text-white">Registrar informe social</h1>
        <p className="mt-1 text-sm text-brand-100">{hogar.direccion}</p>
      </div>

      <BannerSensible>
        Información sensible — visible solo para gestor social, aprobador y administrador.
      </BannerSensible>

      <InformeSocialForm
        action={registrarConHogar}
        integrantes={integrantes}
        solicitudes={solicitudes}
        solicitudPreseleccionada={solicitudPreseleccionada}
      />
    </div>
  )
}
