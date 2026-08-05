import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { obtenerGrupoFamiliar } from '@/lib/hogares/dal'
import { agregarIntegrante } from '@/lib/personas/actions'
import { PersonaForm } from '../persona-form'

export default async function NuevoIntegrantePage({
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

  const agregarConHogar = agregarIntegrante.bind(null, id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nuevo integrante</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{hogar.direccion}</p>
      </div>
      <PersonaForm
        action={agregarConHogar}
        submitLabel="Agregar integrante"
        permiteConfirmarDuplicado
      />
    </div>
  )
}
