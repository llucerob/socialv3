import { requireRole } from '@/lib/auth/dal'
import { crearUsuario } from '@/lib/usuarios/actions'
import { CrearUsuarioForm } from '../crear-usuario-form'

// MR-02: el administrador crea usuarios desde la plataforma.
export default async function NuevoUsuarioPage() {
  await requireRole(['administrador'])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Nuevo usuario</h1>
        <p className="text-sm text-text-muted">
          La cuenta queda activa de inmediato. Entrega la contraseña inicial a la persona; podrá
          cambiarla desde &quot;Mi cuenta&quot;.
        </p>
      </div>
      <CrearUsuarioForm action={crearUsuario} />
    </div>
  )
}
