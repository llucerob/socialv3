import { notFound } from 'next/navigation'
import { getProfile } from '@/lib/auth/dal'
import { obtenerTipoAyuda, obtenerHistorialTipoAyuda } from '@/lib/ayudas/dal'
import { cambiarEstadoTipoAyuda } from '@/lib/ayudas/actions'
import type { TipoAyuda } from '@/lib/ayudas/types'
import { Card } from '@/components/ui/Card'
import { Button, ButtonLink } from '@/components/ui/Button'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { tieneRol } from '@/lib/auth/roles'

const REGLAS: { campo: keyof TipoAyuda; label: string }[] = [
  { campo: 'requiere_aprobacion', label: 'Requiere aprobación' },
  { campo: 'requiere_entrega', label: 'Requiere entrega' },
  // MR-06
  { campo: 'permite_entrega_local', label: 'Permite entrega en local' },
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

  const puedeGestionar = tieneRol(profile, ['administrador'])
  const historial = puedeGestionar ? await obtenerHistorialTipoAyuda(id) : []
  const cambiarEstadoConId = cambiarEstadoTipoAyuda.bind(null, tipoAyuda.id)

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{tipoAyuda.nombre}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-text-muted">
            <span>{tipoAyuda.tipo}</span>
            <EstadoBadge estado={tipoAyuda.estado} />
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
              <Button type="submit" variante="secondary">
                {tipoAyuda.estado === 'activo' ? 'Desactivar' : 'Activar'}
              </Button>
            </form>
            <ButtonLink href={`/ayudas/${tipoAyuda.id}/editar`} variante="secondary">
              Editar
            </ButtonLink>
          </div>
        )}
      </div>

      <Card header={<h2 className="font-medium text-text-primary">Descripción</h2>}>
        <p className="whitespace-pre-wrap text-text-primary">{tipoAyuda.descripcion ?? '—'}</p>
      </Card>

      <Card header={<h2 className="font-medium text-text-primary">Reglas</h2>}>
        <ul className="grid gap-2 sm:grid-cols-2">
          {REGLAS.map((regla) => (
            <li key={regla.campo} className="text-sm">
              <span className={tipoAyuda[regla.campo] ? 'text-text-primary' : 'text-text-muted'}>
                {tipoAyuda[regla.campo] ? '✓' : '✕'} {regla.label}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-text-primary">
          {tipoAyuda.tiene_tope_monetario
            ? `Tope monetario: $${tipoAyuda.tope_monetario?.toLocaleString('es-CL')}`
            : 'Sin tope monetario'}
        </p>
        <p className="mt-1 text-sm text-text-muted">Periodicidad: {tipoAyuda.periodicidad ?? '—'}</p>
      </Card>

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
