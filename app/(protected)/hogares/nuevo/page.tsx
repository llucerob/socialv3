import { requireRole } from '@/lib/auth/dal'
import { crearGrupoFamiliar } from '@/lib/hogares/actions'
import { listarSectoresActivos } from '@/lib/sectores/dal'
import { HogarForm } from '../hogar-form'

export default async function NuevoGrupoFamiliarPage() {
  await requireRole(['administrador', 'evaluador_social'])
  const sectores = await listarSectoresActivos()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nuevo grupo familiar</h1>
      <HogarForm action={crearGrupoFamiliar} submitLabel="Crear grupo familiar" sectores={sectores} />
    </div>
  )
}
