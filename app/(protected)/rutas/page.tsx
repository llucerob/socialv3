import { requireRole } from '@/lib/auth/dal'
import { listarMisEntregas } from '@/lib/entregas/dal'
import { tieneRol } from '@/lib/auth/roles'
import { ordenarParaRuta } from '@/lib/rutas/geo'
import { enlaceMapa } from '@/lib/rutas/mapas'
import { ButtonExterno, ButtonLink } from '@/components/ui/Button'
import { ParadaRuta } from '@/components/ui/ParadaRuta'
import { GeorreferenciacionBadge } from '../hogares/georreferenciacion-badge'

const ROLES = ['administrador', 'terreno_repartidor'] as const

// US-13.01 ("las entregas quedan agrupadas para terreno" — agrupación por
// sector) + US-13.02/US-13.04 (orden ya calculado y/o ajustado, ver
// lib/rutas/geo.ts) + US-13.03 (abrir dirección en mapas). Vista de solo
// lectura: registrar el resultado (realizada/fallida) sigue viviendo en
// /mis-entregas/[id] (EPIC 12), para no duplicar esos formularios en dos
// lugares.
export default async function RutasPage() {
  const profile = await requireRole([...ROLES])
  const entregas = await listarMisEntregas(profile.id, tieneRol(profile, ['administrador']))
  const pendientes = ordenarParaRuta(entregas.filter((entrega) => entrega.estado === 'pendiente'))

  const porSector = new Map<string, typeof pendientes>()
  for (const entrega of pendientes) {
    const lista = porSector.get(entrega.grupo_familiar_sector) ?? []
    lista.push(entrega)
    porSector.set(entrega.grupo_familiar_sector, lista)
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-text-primary">Mi ruta</h1>

      {pendientes.length === 0 ? (
        <p className="text-sm text-text-muted">No tienes entregas pendientes.</p>
      ) : (
        Array.from(porSector.entries()).map(([sector, entregasSector]) => (
          <section key={sector} className="space-y-3">
            <h2 className="font-medium text-text-primary">{sector}</h2>
            <ol className="space-y-2">
              {entregasSector.map((entrega, index) => (
                <ParadaRuta
                  key={entrega.id}
                  orden={index + 1}
                  direccion={entrega.grupo_familiar_direccion}
                  subtitulo={
                    <>
                      {entrega.tipo_ayuda_nombre}
                      {entrega.persona_nombre ? ` · ${entrega.persona_nombre}` : ''}
                    </>
                  }
                  advertencia={
                    <GeorreferenciacionBadge
                      latitud={entrega.grupo_familiar_latitud}
                      longitud={entrega.grupo_familiar_longitud}
                    />
                  }
                >
                  <ButtonLink href={`/mis-entregas/${entrega.id}`} variante="secondary" className="px-3 py-1.5 text-xs">
                    Ver
                  </ButtonLink>
                  <ButtonExterno href={enlaceMapa(entrega)} variante="ghost" className="px-3 py-1.5 text-xs">
                    Mapa
                  </ButtonExterno>
                </ParadaRuta>
              ))}
            </ol>
          </section>
        ))
      )}
    </div>
  )
}
