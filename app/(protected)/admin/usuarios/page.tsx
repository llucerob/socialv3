import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { listarUsuarios } from '@/lib/usuarios/dal'
import { ROL_LABELS } from '@/lib/auth/types'
import { EstadoBadge } from '@/components/ui/EstadoBadge'

// US-19.01: "se listan usuarios".
export default async function UsuariosPage() {
  await requireRole(['administrador'])
  const usuarios = await listarUsuarios()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text-primary">Usuarios</h1>

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
                <span className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-800">
                    {usuario.rol ? ROL_LABELS[usuario.rol] : 'Sin rol'}
                  </span>
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
