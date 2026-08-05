import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { listarSolicitudes } from '@/lib/solicitudes/dal'
import { ESTADO_SOLICITUD_LABELS } from '@/lib/solicitudes/types'

// US-20.02: "terreno no ve historial completo del hogar" — el listado
// completo de solicitudes (motivo, tipo de ayuda, incluidos reembolsos
// médicos) no tenía ningún control de rol antes de esta historia; terreno no
// tiene enlace de nav aquí, pero una navegación directa por URL sí llegaba.
// El resto de roles válidos mantiene el mismo acceso que ya tenía.
const ROLES_VER_SOLICITUDES = [
  'administrador',
  'evaluador_social',
  'aprobador',
  'bodega_logistica',
  'finanzas',
  'auditor_consulta',
] as const

export default async function SolicitudesPage() {
  await requireRole([...ROLES_VER_SOLICITUDES])
  const solicitudes = await listarSolicitudes()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Solicitudes</h1>

      {solicitudes.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Sin solicitudes registradas. Se crean desde la ficha de un grupo familiar.
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
                <span className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
                  {ESTADO_SOLICITUD_LABELS[solicitud.estado]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
