import { requireRole } from '@/lib/auth/dal'
import { crearSector } from '@/lib/sectores/actions'
import { SectorForm } from '../sector-form'

export default async function NuevoSectorPage() {
  await requireRole(['administrador'])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text-primary">Nuevo sector</h1>
      <SectorForm action={crearSector} submitLabel="Crear sector" />
    </div>
  )
}
