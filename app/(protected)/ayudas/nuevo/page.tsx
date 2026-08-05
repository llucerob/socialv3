import { requireRole } from '@/lib/auth/dal'
import { crearTipoAyuda } from '@/lib/ayudas/actions'
import { TipoAyudaForm } from '../tipo-ayuda-form'

export default async function NuevoTipoAyudaPage() {
  await requireRole(['administrador'])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nuevo tipo de ayuda</h1>
      <TipoAyudaForm action={crearTipoAyuda} submitLabel="Crear tipo de ayuda" />
    </div>
  )
}
