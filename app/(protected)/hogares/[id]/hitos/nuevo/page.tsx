import { notFound } from 'next/navigation'
import { obtenerGrupoFamiliar } from '@/lib/hogares/dal'
import { listarIntegrantes } from '@/lib/personas/dal'
import { requireRoleHitos, ROLES_REGISTRAR_HITOS } from '@/lib/hitos/dal'
import { registrarHito } from '@/lib/hitos/actions'
import { HitoForm } from '../../hito-form'
import { BannerSensible } from '@/components/ui/BannerSensible'

export default async function NuevoHitoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireRoleHitos(ROLES_REGISTRAR_HITOS, `/hogares/${id}/hitos/nuevo`, id)

  const hogar = await obtenerGrupoFamiliar(id)
  if (!hogar) {
    notFound()
  }

  const integrantes = await listarIntegrantes(id)
  const registrarConHogar = registrarHito.bind(null, id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Registrar hito</h1>
        <p className="text-sm text-text-muted">{hogar.direccion}</p>
      </div>

      <BannerSensible>
        Información sensible — visible solo para gestor social, aprobador y administrador.
      </BannerSensible>

      <HitoForm action={registrarConHogar} integrantes={integrantes} />
    </div>
  )
}
