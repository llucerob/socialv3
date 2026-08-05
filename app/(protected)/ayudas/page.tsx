import Link from 'next/link'
import { getProfile } from '@/lib/auth/dal'
import { listarTiposAyuda } from '@/lib/ayudas/dal'

export default async function AyudasPage() {
  const profile = await getProfile()
  const tipos = await listarTiposAyuda()
  const puedeGestionar = profile.rol === 'administrador'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Catálogo de ayudas</h1>
        {puedeGestionar && (
          <Link
            href="/ayudas/nuevo"
            className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Nuevo tipo de ayuda
          </Link>
        )}
      </div>

      {tipos.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin tipos de ayuda registrados.</p>
      ) : (
        <ul className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
          {tipos.map((tipoAyuda) => (
            <li key={tipoAyuda.id}>
              <Link
                href={`/ayudas/${tipoAyuda.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <span>
                  <span className="font-medium">{tipoAyuda.nombre}</span>
                  <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {tipoAyuda.tipo}
                  </span>
                </span>
                <span className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
                  {tipoAyuda.estado}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
