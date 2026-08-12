import { requireRole } from '@/lib/auth/dal'
import { listarUsuarios } from '@/lib/usuarios/dal'
import { crearIncidente } from '@/lib/incidentes/actions'
import { IncidenteForm } from '../incidente-form'

export default async function NuevoIncidentePage() {
  await requireRole(['administrador'])
  const usuarios = await listarUsuarios()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text-primary">Registrar incidente de seguridad</h1>
      <IncidenteForm action={crearIncidente} usuarios={usuarios} />
    </div>
  )
}
