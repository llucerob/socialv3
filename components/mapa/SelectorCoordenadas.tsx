'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// US-03.06 — recomendación técnica del backlog: Leaflet + Mapbox (imagen
// satelital) para marcar el punto del domicilio en el mapa.
//
// Fix del ícono default de Leaflet: las rutas relativas a marker-icon.png
// que trae el paquete no resuelven bajo el bundler de Next.js (issue
// conocido de leaflet con webpack/Turbopack). Se sirven los mismos assets
// oficiales del paquete instalado (misma versión) desde unpkg en vez de
// pelear con imports de assets binarios — incidental respecto a la conexión
// que igual requieren las teselas del mapa mismas.
const ICONO_MARCADOR = L.icon({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Sin coordenadas todavía, el mapa abre centrado en la comuna de Coinco
// (referencia aproximada) en vez de un punto arbitrario (0,0/Null Island).
const CENTRO_COINCO: [number, number] = [-34.283, -70.983]
const ZOOM_SIN_COORDENADAS = 13
const ZOOM_CON_COORDENADAS = 17

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

function CapaBase() {
  if (MAPBOX_TOKEN) {
    return (
      <TileLayer
        attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url={`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/256/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
        tileSize={256}
        maxZoom={19}
      />
    )
  }

  // Sin NEXT_PUBLIC_MAPBOX_TOKEN configurado, el mapa sigue siendo funcional
  // con teselas de OpenStreetMap (gratuitas, sin token) — la historia no
  // depende de tener una credencial externa para poder marcar el punto.
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      maxZoom={19}
    />
  )
}

function ManejadorClic({ onCambiar }: { onCambiar: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onCambiar(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Recentra el mapa cuando cambian las coordenadas por una vía distinta a
// interactuar con el propio mapa (ej. tipeo manual en los campos numéricos)
// — MapContainer solo usa `center`/`zoom` como valores iniciales.
function SincronizarVista({ latitud, longitud }: { latitud: number; longitud: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([latitud, longitud], map.getZoom())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitud, longitud])
  return null
}

export function SelectorCoordenadas({
  latitud,
  longitud,
  onCambiar,
  alto = '320px',
}: {
  latitud: number | null
  longitud: number | null
  onCambiar: (lat: number, lng: number) => void
  // Cualquier valor CSS de altura — Leaflet necesita un alto explícito.
  alto?: string
}) {
  const tienePunto = latitud !== null && longitud !== null && !Number.isNaN(latitud) && !Number.isNaN(longitud)
  const centro: [number, number] = tienePunto ? [latitud, longitud] : CENTRO_COINCO

  return (
    <div className="space-y-1">
      <MapContainer
        center={centro}
        zoom={tienePunto ? ZOOM_CON_COORDENADAS : ZOOM_SIN_COORDENADAS}
        style={{ height: alto, width: '100%' }}
        className="rounded border border-black/10 dark:border-white/20"
      >
        <CapaBase />
        <ManejadorClic onCambiar={onCambiar} />
        {tienePunto && (
          <>
            <SincronizarVista latitud={latitud} longitud={longitud} />
            <Marker
              position={[latitud, longitud]}
              icon={ICONO_MARCADOR}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const posicion = (e.target as L.Marker).getLatLng()
                  onCambiar(posicion.lat, posicion.lng)
                },
              }}
            />
          </>
        )}
      </MapContainer>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Clic en el mapa para marcar el punto (el marcador también se puede arrastrar).
        {!MAPBOX_TOKEN &&
          ' Vista satelital no disponible en este entorno (falta configurar NEXT_PUBLIC_MAPBOX_TOKEN) — mostrando mapa base.'}
      </p>
    </div>
  )
}
