import { notFound } from 'next/navigation'
import { getProfile } from '@/lib/auth/dal'
import { obtenerSector, obtenerHistorialSector } from '@/lib/sectores/dal'
import { cambiarEstadoSector } from '@/lib/sectores/actions'
import { Button, ButtonLink } from '@/components/ui/Button'
import { EstadoBadge } from '@/components/ui/EstadoBadge'

export default async function FichaSectorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getProfile()
  const sector = await obtenerSector(id)

  if (!sector) {
    notFound()
  }

  const puedeGestionar = profile.rol === 'administrador'
  const historial = puedeGestionar ? await obtenerHistorialSector(id) : []
  const cambiarEstadoConId = cambiarEstadoSector.bind(null, sector.id)

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{sector.nombre}</h1>
          <p className="mt-1">
            <EstadoBadge estado={sector.estado} />
          </p>
        </div>
        {puedeGestionar && (
          <div className="flex items-center gap-2">
            <form action={cambiarEstadoConId}>
              <input type="hidden" name="estado" value={sector.estado === 'activo' ? 'inactivo' : 'activo'} />
              <Button type="submit" variante="secondary">
                {sector.estado === 'activo' ? 'Desactivar' : 'Activar'}
              </Button>
            </form>
            <ButtonLink href={`/admin/sectores/${sector.id}/editar`} variante="secondary">
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
