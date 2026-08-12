import { notFound } from 'next/navigation'
import { getProfile } from '@/lib/auth/dal'
import { obtenerMotivoEntregaFallida, obtenerHistorialMotivoEntregaFallida } from '@/lib/motivos-entrega/dal'
import { cambiarEstadoMotivoEntregaFallida } from '@/lib/motivos-entrega/actions'
import { Button, ButtonLink } from '@/components/ui/Button'
import { EstadoBadge } from '@/components/ui/EstadoBadge'

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
          <h1 className="text-2xl font-semibold text-text-primary">{motivo.nombre}</h1>
          <p className="mt-1">
            <EstadoBadge estado={motivo.estado} />
          </p>
        </div>
        {puedeGestionar && (
          <div className="flex items-center gap-2">
            <form action={cambiarEstadoConId}>
              <input type="hidden" name="estado" value={motivo.estado === 'activo' ? 'inactivo' : 'activo'} />
              <Button type="submit" variante="secondary">
                {motivo.estado === 'activo' ? 'Desactivar' : 'Activar'}
              </Button>
            </form>
            <ButtonLink href={`/admin/motivos-entrega/${motivo.id}/editar`} variante="secondary">
              Editar
            </ButtonLink>
          </div>
        )}
      </div>

      {puedeGestionar && (
        <section>
          <h2 className="font-medium text-text-primary">Historial de cambios</h2>
          {historial.length === 0 ? (
            <p className="mt-2 text-sm text-text-muted">Sin cambios registrados todavía.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {historial.map((cambio) => (
                <li key={cambio.id} className="text-text-muted">
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
