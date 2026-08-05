import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { obtenerTipoAyuda } from '@/lib/ayudas/dal'
import { actualizarTipoAyuda } from '@/lib/ayudas/actions'
import { TipoAyudaForm } from '../../tipo-ayuda-form'

export default async function EditarTipoAyudaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireRole(['administrador'])

  const tipoAyuda = await obtenerTipoAyuda(id)
  if (!tipoAyuda) {
    notFound()
  }

  const actualizarConId = actualizarTipoAyuda.bind(null, id)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar tipo de ayuda</h1>
      <TipoAyudaForm
        action={actualizarConId}
        defaultValues={tipoAyuda}
        submitLabel="Guardar cambios"
      />
    </div>
  )
}
