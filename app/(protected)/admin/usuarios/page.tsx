import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { listarUsuarios } from '@/lib/usuarios/dal'
import { ROL_LABELS } from '@/lib/auth/types'
import { ROLES_ORDENADOS } from '@/lib/auth/roles'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { ButtonLink } from '@/components/ui/Button'

// US-19.01: "se listan usuarios".
export default async function UsuariosPage() {
  await requireRole(['administrador'])
  const usuarios = await listarUsuarios()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-text-primary">Usuarios</h1>
        {/* MR-02 */}
        <ButtonLink href="/admin/usuarios/nuevo">Nuevo usuario</ButtonLink>
      </div>

      {usuarios.length === 0 ? (
        <p className="text-sm text-text-muted">Sin usuarios registrados.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {usuarios.map((usuario) => (
            <li key={usuario.id}>
              <Link
                href={`/admin/usuarios/${usuario.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-alt"
              >
                <span className="min-w-0">
                  <span className="font-medium text-text-primary">{usuario.nombre}</span>
                  <span className="ml-2 text-sm text-text-muted">{usuario.email}</span>
                </span>
                <span className="flex flex-wrap items-center justify-end gap-2">
                  {usuario.roles.length === 0 ? (
                    <span className="rounded-full bg-neutral-bg px-2.5 py-0.5 text-xs font-medium text-neutral-fg">
                      Sin rol
                    </span>
                  ) : (
                    ROLES_ORDENADOS.filter((rol) => usuario.roles.includes(rol)).map((rol) => (
                      <span
                        key={rol}
                        className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-800"
                      >
                        {ROL_LABELS[rol]}
                      </span>
                    ))
                  )}
                  <EstadoBadge estado={usuario.estado} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
