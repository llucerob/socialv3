import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { obtenerMotivoEntregaFallida } from '@/lib/motivos-entrega/dal'
import { actualizarMotivoEntregaFallida } from '@/lib/motivos-entrega/actions'
import { MotivoForm } from '../../motivo-form'

export default async function EditarMotivoEntregaFallidaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireRole(['administrador'])

  const motivo = await obtenerMotivoEntregaFallida(id)
  if (!motivo) {
    notFound()
  }

  const actualizarConId = actualizarMotivoEntregaFallida.bind(null, id)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text-primary">Editar motivo de entrega fallida</h1>
      <MotivoForm action={actualizarConId} defaultValues={motivo} submitLabel="Guardar cambios" />
    </div>
  )
}
