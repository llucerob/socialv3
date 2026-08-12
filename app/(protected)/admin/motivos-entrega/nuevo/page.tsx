import { requireRole } from '@/lib/auth/dal'
import { crearMotivoEntregaFallida } from '@/lib/motivos-entrega/actions'
import { MotivoForm } from '../motivo-form'

export default async function NuevoMotivoEntregaFallidaPage() {
  await requireRole(['administrador'])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text-primary">Nuevo motivo de entrega fallida</h1>
      <MotivoForm action={crearMotivoEntregaFallida} submitLabel="Crear motivo" />
    </div>
  )
}
