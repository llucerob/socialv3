import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { obtenerUsuario, obtenerHistorialUsuario } from '@/lib/usuarios/dal'
import { cambiarRolUsuario, cambiarEstadoUsuario } from '@/lib/usuarios/actions'
import { ROL_LABELS } from '@/lib/auth/types'
import { CambiarRolForm } from '../cambiar-rol-form'
import { CambiarEstadoUsuarioForm } from '../cambiar-estado-usuario-form'

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
  const cambiarRolConId = cambiarRolUsuario.bind(null, id)
  const cambiarEstadoConId = cambiarEstadoUsuario.bind(null, id)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{usuario.nombre}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{usuario.email}</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {usuario.rol ? ROL_LABELS[usuario.rol] : 'Sin rol asignado'} · {usuario.estado}
        </p>
      </div>

      {esUnoMismo ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No puedes cambiar tu propio rol ni desactivar tu propia cuenta.
        </p>
      ) : (
        <section className="space-y-4">
          <CambiarRolForm action={cambiarRolConId} rolActual={usuario.rol} />
          <CambiarEstadoUsuarioForm action={cambiarEstadoConId} estadoActual={usuario.estado} />
        </section>
      )}

      <section>
        <h2 className="font-medium">Historial de cambios</h2>
        {historial.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Sin cambios registrados todavía.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {historial.map((cambio) => (
              <li key={cambio.id} className="text-zinc-600 dark:text-zinc-400">
                {new Date(cambio.creado_en).toLocaleString('es-CL')} · {cambio.campo}:{' '}
                {cambio.valor_anterior ?? '—'} → {cambio.valor_nuevo ?? '—'}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
