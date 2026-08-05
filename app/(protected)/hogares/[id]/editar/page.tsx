import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { obtenerGrupoFamiliar } from '@/lib/hogares/dal'
import { actualizarGrupoFamiliar } from '@/lib/hogares/actions'
import { listarSectoresActivos } from '@/lib/sectores/dal'
import { HogarForm } from '../../hogar-form'

export default async function EditarGrupoFamiliarPage({
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

  const sectores = await listarSectoresActivos()
  const actualizarConId = actualizarGrupoFamiliar.bind(null, id)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar grupo familiar</h1>
      <HogarForm action={actualizarConId} defaultValues={hogar} submitLabel="Guardar cambios" sectores={sectores} />
    </div>
  )
}
