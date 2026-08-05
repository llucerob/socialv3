import { point, distance } from '@turf/turf'

export type PuntoConId = { id: string; lat: number; lng: number }

// US-13.04 — heurística greedy de vecino más cercano sobre distancia en
// línea recta (haversine, vía @turf/turf) partiendo de un punto de origen
// configurable. Ver docs/backlog.md (US-13.04, "🆕 Recomendación técnica")
// para la justificación completa: no usa ningún servicio externo de ruteo
// por calles (Google Directions, OSRM, etc.) — es una aproximación
// deliberada para esta iteración, tal como lo plantea el propio Contexto
// Maestro (sección 35) como algo a resolver en una versión posterior.
export function ordenarPorCercania(
  origen: { lat: number; lng: number },
  puntos: PuntoConId[]
): PuntoConId[] {
  const pendientes = [...puntos]
  const ruta: PuntoConId[] = []
  let actual = point([origen.lng, origen.lat])

  while (pendientes.length > 0) {
    let masCercanoIdx = 0
    let menorDistancia = Infinity

    pendientes.forEach((candidato, i) => {
      const d = distance(actual, point([candidato.lng, candidato.lat]), { units: 'kilometers' })
      if (d < menorDistancia) {
        menorDistancia = d
        masCercanoIdx = i
      }
    })

    const siguiente = pendientes.splice(masCercanoIdx, 1)[0]
    ruta.push(siguiente)
    actual = point([siguiente.lng, siguiente.lat])
  }

  return ruta
}

type EntregaOrdenable = {
  orden_ruta: number | null
  fecha_programada: string | null
  created_at: string
}

// Orden de visualización para /rutas y /entregas: por orden_ruta ascendente
// (nulls al final — entregas cuyo sector todavía no pasó por un cálculo ni
// un ajuste manual), con fecha_programada y created_at como desempate
// determinístico dentro de ese grupo "sin ordenar".
export function ordenarParaRuta<T extends EntregaOrdenable>(entregas: T[]): T[] {
  return [...entregas].sort((a, b) => {
    if (a.orden_ruta !== null && b.orden_ruta !== null) return a.orden_ruta - b.orden_ruta
    if (a.orden_ruta !== null) return -1
    if (b.orden_ruta !== null) return 1

    const fechaA = a.fecha_programada ?? ''
    const fechaB = b.fecha_programada ?? ''
    return fechaA.localeCompare(fechaB) || a.created_at.localeCompare(b.created_at)
  })
}
