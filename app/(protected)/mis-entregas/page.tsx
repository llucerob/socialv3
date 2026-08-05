import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { listarMisEntregas } from '@/lib/entregas/dal'
import { ESTADO_ENTREGA_LABELS } from '@/lib/entregas/types'
import { enlaceMapa } from '@/lib/rutas/mapas'

const ROLES_TERRENO = ['administrador', 'terreno_repartidor'] as const

// US-12.03: "el funcionario ve solo sus entregas" (la RLS de entregas ya
// filtra por responsable_id = auth.uid() para terreno_repartidor) ·
// "se muestra dirección, beneficiario y ayuda" · "se muestra estado" ·
// "no se muestra información sensible innecesaria" — sin motivo de
// solicitud, observaciones internas, evaluación social ni otros documentos.
// US-20.01: tarjetas grandes en vez de tabla densa, pensadas para teléfono.
export default async function MisEntregasPage() {
  await requireRole([...ROLES_TERRENO])
  const entregas = await listarMisEntregas()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Mis entregas</h1>

      {entregas.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No tienes entregas asignadas.</p>
      ) : (
        <ul className="space-y-3">
          {entregas.map((entrega) => (
            <li key={entrega.id} className="rounded border border-black/10 p-4 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium">{entrega.tipo_ayuda_nombre}</span>
                <span className="rounded bg-black/5 px-2 py-1 text-xs font-medium uppercase dark:bg-white/10">
                  {ESTADO_ENTREGA_LABELS[entrega.estado]}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {entrega.grupo_familiar_direccion}
                {entrega.grupo_familiar_sector && ` · ${entrega.grupo_familiar_sector}`}
              </p>
              {entrega.persona_nombre && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{entrega.persona_nombre}</p>
              )}
              {entrega.fecha_programada && (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Programada: {entrega.fecha_programada}
                </p>
              )}
              <div className="mt-3 flex items-center gap-4 text-sm">
                <Link href={`/mis-entregas/${entrega.id}`} className="font-medium underline">
                  Ver detalle
                </Link>
                <a href={enlaceMapa(entrega)} target="_blank" rel="noopener noreferrer" className="underline">
                  Abrir en mapas
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
