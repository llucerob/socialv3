import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { listarUsuarios } from '@/lib/usuarios/dal'
import { ROL_LABELS } from '@/lib/auth/types'

// US-19.01: "se listan usuarios".
export default async function UsuariosPage() {
  await requireRole(['administrador'])
  const usuarios = await listarUsuarios()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Usuarios</h1>

      {usuarios.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin usuarios registrados.</p>
      ) : (
        <ul className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
          {usuarios.map((usuario) => (
            <li key={usuario.id}>
              <Link
                href={`/admin/usuarios/${usuario.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <span>
                  <span className="font-medium">{usuario.nombre}</span>
                  <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">{usuario.email}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2 text-xs uppercase text-zinc-500 dark:text-zinc-400">
                  <span>{usuario.rol ? ROL_LABELS[usuario.rol] : 'Sin rol'}</span>
                  <span
                    className={
                      usuario.estado === 'activo'
                        ? 'rounded-full border border-green-600/30 bg-green-600/10 px-2 py-0.5 text-green-700 dark:text-green-500'
                        : 'rounded-full border border-black/10 bg-black/5 px-2 py-0.5 dark:border-white/20 dark:bg-white/10'
                    }
                  >
                    {usuario.estado}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
