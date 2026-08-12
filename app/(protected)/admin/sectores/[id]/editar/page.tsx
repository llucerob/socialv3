import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { obtenerSector } from '@/lib/sectores/dal'
import { actualizarSector } from '@/lib/sectores/actions'
import { SectorForm } from '../../sector-form'

export default async function EditarSectorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireRole(['administrador'])

  const sector = await obtenerSector(id)
  if (!sector) {
    notFound()
  }

  const actualizarConId = actualizarSector.bind(null, id)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text-primary">Editar sector</h1>
      <SectorForm action={actualizarConId} defaultValues={sector} submitLabel="Guardar cambios" />
    </div>
  )
}
