import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { obtenerUsuario, obtenerHistorialUsuario } from '@/lib/usuarios/dal'
import { cambiarRolesUsuario, cambiarEstadoUsuario } from '@/lib/usuarios/actions'
import { ROL_LABELS, type RolUsuario } from '@/lib/auth/types'
import { etiquetaRoles } from '@/lib/auth/roles'
import { CambiarRolesForm } from '../cambiar-roles-form'
import { CambiarEstadoUsuarioForm } from '../cambiar-estado-usuario-form'
import { EstadoBadge } from '@/components/ui/EstadoBadge'

// El historial guarda los roles como JSON (log_profile_cambio usa
// to_jsonb ->> 'roles'); las filas anteriores a los roles múltiples
// guardaban un solo rol en el campo 'rol'. Ambos se muestran con etiquetas.
function valorLegible(campo: string, valor: string | null): string {
  if (valor === null) return '—'
  if (campo === 'rol') return ROL_LABELS[valor as RolUsuario] ?? valor
  if (campo === 'roles') {
    try {
      return etiquetaRoles(JSON.parse(valor) as RolUsuario[])
    } catch {
      return valor
    }
  }
  return valor
}

// US-19.01: "se puede cambiar rol · se puede activar o desactivar usuario ·
// los cambios quedan auditados" (historial visible más abajo, igual criterio
// que tipos_ayuda/grupos_familiares).
export default async function FichaUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requireRole(['administrador'])
  const usuario = await obtenerUsuario(id)

  if (!usuario) {
    notFound()
  }

  const esUnoMismo = usuario.id === profile.id
  const historial = await obtenerHistorialUsuario(id)
  const cambiarRolesConId = cambiarRolesUsuario.bind(null, id)
  const cambiarEstadoConId = cambiarEstadoUsuario.bind(null, id)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">{usuario.nombre}</h1>
        <p className="text-sm text-text-muted">{usuario.email}</p>
        <p className="mt-1 flex items-center gap-2 text-sm text-text-muted">
          <span>{usuario.roles.length > 0 ? etiquetaRoles(usuario.roles) : 'Sin rol asignado'}</span>
          <EstadoBadge estado={usuario.estado} />
        </p>
      </div>

      <section className="space-y-6">
        <CambiarRolesForm action={cambiarRolesConId} rolesActuales={usuario.roles} esUnoMismo={esUnoMismo} />
        {esUnoMismo ? (
          <p className="text-sm text-text-muted">No puedes desactivar tu propia cuenta.</p>
        ) : (
          <CambiarEstadoUsuarioForm action={cambiarEstadoConId} estadoActual={usuario.estado} />
        )}
      </section>

      <section>
        <h2 className="font-medium text-text-primary">Historial de cambios</h2>
        {historial.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">Sin cambios registrados todavía.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {historial.map((cambio) => (
              <li key={cambio.id} className="text-text-muted">
                {new Date(cambio.creado_en).toLocaleString('es-CL')} · {cambio.campo}:{' '}
                {valorLegible(cambio.campo, cambio.valor_anterior)} →{' '}
                {valorLegible(cambio.campo, cambio.valor_nuevo)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
