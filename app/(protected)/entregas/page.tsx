import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { listarEntregas, listarFuncionariosTerreno } from '@/lib/entregas/dal'
import { asignarResponsableLote, moverEntregaEnRuta } from '@/lib/rutas/actions'
import { ordenarParaRuta } from '@/lib/rutas/geo'
import { enlaceMapa } from '@/lib/rutas/mapas'
import { AsignarLoteForm } from './asignar-lote-form'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { FiltrosBar, CampoFiltro } from '@/components/ui/FiltrosBar'
import { ParadaRuta } from '@/components/ui/ParadaRuta'
import { GeorreferenciacionBadge } from '../hogares/georreferenciacion-badge'
import { formatearFecha } from '@/lib/fechas'

const ROLES_LOGISTICA = ['administrador', 'bodega_logistica'] as const

// US-12.01/US-12.02: vista general de bodega/administrador sobre todas las
// entregas, para gestionar asignación y seguimiento. Cada fila enlaza al
// detalle de la solicitud, donde viven las acciones de crear/asignar/
// reprogramar una entrega individual (ver sección "Entrega" en
// solicitudes/[id]/page.tsx).
//
// US-13.01: agrega filtro por sector + selección múltiple + asignación
// masiva. US-13.04/US-13.02: al filtrar por sector, muestra además la ruta
// calculada (o pendiente de calcular) con ajuste manual de orden.
// US-13.03: enlace "Mapa" por entrega.
export default async function EntregasPage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string }>
}) {
  const profile = await requireRole([...ROLES_LOGISTICA])
  const { sector = '' } = await searchParams
  const todas = await listarEntregas()
  const sectores = [...new Set(todas.map((entrega) => entrega.grupo_familiar_sector).filter(Boolean))].sort()

  const entregas = sector ? todas.filter((entrega) => entrega.grupo_familiar_sector === sector) : todas
  const pendientesDelSector = sector
    ? ordenarParaRuta(entregas.filter((entrega) => entrega.estado === 'pendiente'))
    : []
  const funcionarios = sector ? await listarFuncionariosTerreno() : []

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-text-primary">Entregas</h1>

      <FiltrosBar hrefLimpiar={sector ? '/entregas' : undefined}>
        <CampoFiltro label="Sector" htmlFor="sector">
          <select
            id="sector"
            name="sector"
            defaultValue={sector}
            className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary"
          >
            <option value="">Todos los sectores</option>
            {sectores.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </CampoFiltro>
      </FiltrosBar>

      {entregas.length === 0 ? (
        <p className="text-sm text-text-muted">
          Sin entregas para este filtro. Se crean desde una solicitud aprobada.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {entregas.map((entrega) => (
            <li key={entrega.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <Link href={`/solicitudes/${entrega.solicitud_id}`} className="min-w-0 flex-1 hover:underline">
                <span className="font-medium text-text-primary">{entrega.tipo_ayuda_nombre}</span>
                <span className="ml-2 text-sm text-text-muted">
                  {entrega.grupo_familiar_direccion}
                  {entrega.persona_nombre ? ` · ${entrega.persona_nombre}` : ''}
                  {entrega.fecha_programada ? ` · programada ${formatearFecha(entrega.fecha_programada)}` : ''}
                  {' · '}
                  {entrega.responsable_nombre ?? 'sin asignar'}
                </span>
              </Link>
              <a
                href={enlaceMapa(entrega)}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-sm text-brand-600 hover:underline"
              >
                Mapa
              </a>
              <EstadoBadge estado={entrega.estado} />
            </li>
          ))}
        </ul>
      )}

      {sector && (
        <Card
          header={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-medium text-text-primary">Ruta del sector &quot;{sector}&quot;</h2>
              <div className="flex items-center gap-3">
                {profile.rol === 'administrador' && (
                  <Link href="/rutas/configuracion" className="text-sm text-brand-600 hover:underline">
                    Configurar punto de origen
                  </Link>
                )}
                <form action="/api/rutas/calcular-orden" method="post">
                  <input type="hidden" name="sector" value={sector} />
                  <Button type="submit">Calcular orden por cercanía</Button>
                </form>
              </div>
            </div>
          }
        >
          {pendientesDelSector.length === 0 ? (
            <p className="text-sm text-text-muted">Sin entregas pendientes en este sector.</p>
          ) : (
            <div className="space-y-4">
              <AsignarLoteForm action={asignarResponsableLote} funcionarios={funcionarios} />

              <ol className="space-y-2">
                {pendientesDelSector.map((entrega, index) => {
                  const moverArribaConId = moverEntregaEnRuta.bind(null, entrega.id, 'arriba')
                  const moverAbajoConId = moverEntregaEnRuta.bind(null, entrega.id, 'abajo')

                  return (
                    <ParadaRuta
                      key={entrega.id}
                      orden={index + 1}
                      direccion={entrega.grupo_familiar_direccion}
                      subtitulo={entrega.responsable_nombre ?? 'sin asignar'}
                      advertencia={
                        <GeorreferenciacionBadge
                          latitud={entrega.grupo_familiar_latitud}
                          longitud={entrega.grupo_familiar_longitud}
                        />
                      }
                    >
                      <input type="checkbox" name="entrega_id" value={entrega.id} form="asignar-lote" />
                      <a href={enlaceMapa(entrega)} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                        Mapa
                      </a>
                      <form action={moverArribaConId}>
                        <input type="hidden" name="sector" value={sector} />
                        <button
                          type="submit"
                          disabled={index === 0}
                          aria-label="Mover arriba"
                          className="rounded-lg border border-border px-2 py-1 text-text-primary disabled:opacity-30"
                        >
                          ▲
                        </button>
                      </form>
                      <form action={moverAbajoConId}>
                        <input type="hidden" name="sector" value={sector} />
                        <button
                          type="submit"
                          disabled={index === pendientesDelSector.length - 1}
                          aria-label="Mover abajo"
                          className="rounded-lg border border-border px-2 py-1 text-text-primary disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </form>
                    </ParadaRuta>
                  )
                })}
              </ol>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
