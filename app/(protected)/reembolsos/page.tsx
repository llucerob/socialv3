import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { listarSolicitudesReembolso } from '@/lib/reembolsos/dal'
import { ESTADO_SOLICITUD_LABELS } from '@/lib/solicitudes/types'

// Mismo criterio de gating que el resto del nav (US-20.02: la página debe
// exigir el mismo rol que ya la expone en NAV_BY_ROL, no más ni menos) —
// "Reembolsos" solo aparece para administrador y finanzas.
const ROLES_VER_REEMBOLSOS = ['administrador', 'finanzas'] as const

export default async function ReembolsosPage() {
  await requireRole([...ROLES_VER_REEMBOLSOS])
  const solicitudes = await listarSolicitudesReembolso()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reembolsos</h1>

      {solicitudes.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Sin solicitudes de reembolso registradas todavía.
        </p>
      ) : (
        <ul className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
          {solicitudes.map((solicitud) => (
            <li key={solicitud.id}>
              <Link
                href={`/solicitudes/${solicitud.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <span>
                  <span className="font-medium">{solicitud.tipo_ayuda_nombre}</span>
                  <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {solicitud.grupo_familiar_direccion}
                    {solicitud.persona_nombre ? ` · ${solicitud.persona_nombre}` : ''}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  {solicitud.monto_solicitado !== null && (
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      ${solicitud.monto_solicitado.toLocaleString('es-CL')}
                    </span>
                  )}
                  <span className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
                    {ESTADO_SOLICITUD_LABELS[solicitud.estado]}
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
