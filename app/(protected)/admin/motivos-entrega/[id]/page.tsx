import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProfile } from '@/lib/auth/dal'
import { obtenerMotivoEntregaFallida, obtenerHistorialMotivoEntregaFallida } from '@/lib/motivos-entrega/dal'
import { cambiarEstadoMotivoEntregaFallida } from '@/lib/motivos-entrega/actions'

export default async function FichaMotivoEntregaFallidaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const profile = await getProfile()
  const motivo = await obtenerMotivoEntregaFallida(id)

  if (!motivo) {
    notFound()
  }

  const puedeGestionar = profile.rol === 'administrador'
  const historial = puedeGestionar ? await obtenerHistorialMotivoEntregaFallida(id) : []
  const cambiarEstadoConId = cambiarEstadoMotivoEntregaFallida.bind(null, motivo.id)

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{motivo.nombre}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">estado {motivo.estado}</p>
        </div>
        {puedeGestionar && (
          <div className="flex items-center gap-2">
            <form action={cambiarEstadoConId}>
              <input type="hidden" name="estado" value={motivo.estado === 'activo' ? 'inactivo' : 'activo'} />
              <button
                type="submit"
                className="rounded border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/20"
              >
                {motivo.estado === 'activo' ? 'Desactivar' : 'Activar'}
              </button>
            </form>
            <Link
              href={`/admin/motivos-entrega/${motivo.id}/editar`}
              className="rounded border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/20"
            >
              Editar
            </Link>
          </div>
        )}
      </div>

      {puedeGestionar && (
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
      )}
    </div>
  )
}
