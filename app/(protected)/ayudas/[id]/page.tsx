import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProfile } from '@/lib/auth/dal'
import { obtenerTipoAyuda, obtenerHistorialTipoAyuda } from '@/lib/ayudas/dal'
import { cambiarEstadoTipoAyuda } from '@/lib/ayudas/actions'
import type { TipoAyuda } from '@/lib/ayudas/types'

const REGLAS: { campo: keyof TipoAyuda; label: string }[] = [
  { campo: 'requiere_aprobacion', label: 'Requiere aprobación' },
  { campo: 'requiere_entrega', label: 'Requiere entrega' },
  { campo: 'requiere_evidencia', label: 'Requiere evidencia' },
  { campo: 'requiere_persona_beneficiaria', label: 'Requiere persona beneficiaria' },
  { campo: 'requiere_documentos', label: 'Requiere documentos' },
]

export default async function FichaTipoAyudaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const profile = await getProfile()
  const tipoAyuda = await obtenerTipoAyuda(id)

  if (!tipoAyuda) {
    notFound()
  }

  const puedeGestionar = profile.rol === 'administrador'
  const historial = puedeGestionar ? await obtenerHistorialTipoAyuda(id) : []
  const cambiarEstadoConId = cambiarEstadoTipoAyuda.bind(null, tipoAyuda.id)

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{tipoAyuda.nombre}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {tipoAyuda.tipo} · estado {tipoAyuda.estado}
          </p>
        </div>
        {puedeGestionar && (
          <div className="flex items-center gap-2">
            <form action={cambiarEstadoConId}>
              <input
                type="hidden"
                name="estado"
                value={tipoAyuda.estado === 'activo' ? 'inactivo' : 'activo'}
              />
              <button
                type="submit"
                className="rounded border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/20"
              >
                {tipoAyuda.estado === 'activo' ? 'Desactivar' : 'Activar'}
              </button>
            </form>
            <Link
              href={`/ayudas/${tipoAyuda.id}/editar`}
              className="rounded border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/20"
            >
              Editar
            </Link>
          </div>
        )}
      </div>

      <section>
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Descripción</h2>
        <p className="whitespace-pre-wrap">{tipoAyuda.descripcion ?? '—'}</p>
      </section>

      <section>
        <h2 className="font-medium">Reglas</h2>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {REGLAS.map((regla) => (
            <li key={regla.campo} className="text-sm">
              <span
                className={
                  tipoAyuda[regla.campo]
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-400 dark:text-zinc-600'
                }
              >
                {tipoAyuda[regla.campo] ? '✓' : '✕'} {regla.label}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm">
          {tipoAyuda.tiene_tope_monetario
            ? `Tope monetario: $${tipoAyuda.tope_monetario?.toLocaleString('es-CL')}`
            : 'Sin tope monetario'}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Periodicidad: {tipoAyuda.periodicidad ?? '—'}
        </p>
      </section>

      {puedeGestionar && (
        <section>
          <h2 className="font-medium">Historial de cambios</h2>
          {historial.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Sin cambios registrados todavía.
            </p>
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
      )}
    </div>
  )
}
