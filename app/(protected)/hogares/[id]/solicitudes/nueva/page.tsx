import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { obtenerGrupoFamiliar } from '@/lib/hogares/dal'
import { listarIntegrantes } from '@/lib/personas/dal'
import { listarTiposAyudaActivos } from '@/lib/ayudas/dal'
import { crearSolicitud } from '@/lib/solicitudes/actions'
import { SolicitudForm } from '@/app/(protected)/solicitudes/solicitud-form'

export default async function NuevaSolicitudPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireRole(['administrador', 'evaluador_social'])

  const hogar = await obtenerGrupoFamiliar(id)
  if (!hogar) {
    notFound()
  }

  // 🆕 EPIC 25 (US-25.04): el reembolso excepcional por fallecimiento debe
  // poder seleccionar como beneficiario a un integrante fallecido — se pasa
  // el listado completo del hogar (no solo activos) al formulario genérico;
  // validarCampos (lib/solicitudes/actions.ts) sigue exigiendo 'activo' para
  // el resto de tipos de ayuda.
  const [tiposAyuda, personasActivas] = await Promise.all([
    listarTiposAyudaActivos(),
    listarIntegrantes(id),
  ])

  const crearConHogar = crearSolicitud.bind(null, id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nueva solicitud</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{hogar.direccion}</p>
      </div>
      <SolicitudForm
        action={crearConHogar}
        tiposAyuda={tiposAyuda}
        personasActivas={personasActivas}
        submitLabel="Ingresar solicitud"
        mostrarGuardarBorrador
      />
    </div>
  )
}
