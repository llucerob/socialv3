import Link from 'next/link'
import { getProfile } from '@/lib/auth/dal'
import { listarMotivosEntregaFallida } from '@/lib/motivos-entrega/dal'

// US-19.03: "se pueden crear/activar/desactivar motivos [de entrega fallida]".
export default async function MotivosEntregaFallidaPage() {
  const profile = await getProfile()
  const motivos = await listarMotivosEntregaFallida()
  const puedeGestionar = profile.rol === 'administrador'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Motivos de entrega fallida</h1>
        {puedeGestionar && (
          <Link
            href="/admin/motivos-entrega/nuevo"
            className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Nuevo motivo
          </Link>
        )}
      </div>

      {motivos.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin motivos registrados.</p>
      ) : (
        <ul className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
          {motivos.map((motivo) => (
            <li key={motivo.id}>
              <Link
                href={`/admin/motivos-entrega/${motivo.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <span className="font-medium">{motivo.nombre}</span>
                <span className="text-xs uppercase text-zinc-500 dark:text-zinc-400">{motivo.estado}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
