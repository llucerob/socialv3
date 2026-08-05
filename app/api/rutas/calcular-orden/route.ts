import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'
import { listarEntregasDeSector } from '@/lib/entregas/dal'
import { obtenerConfiguracionRutas } from '@/lib/rutas/dal'
import { ordenarPorCercania } from '@/lib/rutas/geo'

// US-13.04 — "ejecutado en el servidor (API route), no en el cliente"
// (decisión técnica ya tomada, ver CLAUDE.md). Ruta dedicada en vez de una
// Server Action: la recomendación técnica del backlog (US-13.04) es
// explícita en que este cálculo debe vivir en una API route / Edge
// Function, no atado al ciclo de vida de un formulario de useActionState.
const ROLES_LOGISTICA = ['administrador', 'bodega_logistica'] as const

export async function POST(request: Request) {
  await requireRole([...ROLES_LOGISTICA])

  const formData = await request.formData()
  const sector = formData.get('sector')?.toString().trim() ?? ''

  if (!sector) {
    redirect('/entregas')
  }

  const entregasSector = (await listarEntregasDeSector(sector)).filter(
    (entrega) => entrega.estado === 'pendiente'
  )

  const conCoordenadas = entregasSector.filter(
    (entrega) => entrega.grupo_familiar_latitud !== null && entrega.grupo_familiar_longitud !== null
  )
  // US-13.04: "los hogares sin coordenadas registradas quedan agrupados al
  // final de la lista del sector... sin bloquear el cálculo del resto".
  const sinCoordenadas = entregasSector.filter(
    (entrega) => entrega.grupo_familiar_latitud === null || entrega.grupo_familiar_longitud === null
  )

  const configuracion = await obtenerConfiguracionRutas()

  const ordenados =
    conCoordenadas.length > 0
      ? ordenarPorCercania(
          { lat: configuracion.origen_latitud, lng: configuracion.origen_longitud },
          conCoordenadas.map((entrega) => ({
            id: entrega.id,
            lat: entrega.grupo_familiar_latitud as number,
            lng: entrega.grupo_familiar_longitud as number,
          }))
        )
      : []

  // Orden determinístico para el grupo sin coordenadas (no hay heurística
  // de distancia posible sin ellas): por fecha programada y luego antigüedad.
  const sinCoordenadasOrdenadas = [...sinCoordenadas].sort((a, b) => {
    const fechaA = a.fecha_programada ?? ''
    const fechaB = b.fecha_programada ?? ''
    return fechaA.localeCompare(fechaB) || a.created_at.localeCompare(b.created_at)
  })

  const idsEnOrden = [
    ...ordenados.map((entrega) => entrega.id),
    ...sinCoordenadasOrdenadas.map((entrega) => entrega.id),
  ]

  const supabase = await createClient()
  await Promise.all(
    idsEnOrden.map((id, index) => supabase.from('entregas').update({ orden_ruta: index + 1 }).eq('id', id))
  )

  redirect(`/entregas?sector=${encodeURIComponent(sector)}`)
}
