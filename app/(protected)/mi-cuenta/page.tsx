import { getProfile } from '@/lib/auth/dal'
import { etiquetaRoles } from '@/lib/auth/roles'
import { cambiarMiContrasena } from '@/lib/auth/actions'
import { Card } from '@/components/ui/Card'
import { CambiarContrasenaForm } from './cambiar-contrasena-form'

// MR-03: cualquier usuario con sesión, sea cual sea su rol.
export default async function MiCuentaPage() {
  const profile = await getProfile()

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Mi cuenta</h1>
        <p className="text-sm text-text-muted">
          {profile.nombre} · {profile.email}
        </p>
        <p className="text-sm text-text-muted">{etiquetaRoles(profile.roles)}</p>
      </div>

      <Card>
        <h2 className="mb-4 font-semibold text-text-primary">Cambiar contraseña</h2>
        <CambiarContrasenaForm action={cambiarMiContrasena} />
      </Card>
    </div>
  )
}
