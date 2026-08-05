// US-13.03: "cada entrega tiene opción de abrir dirección" · "la acción abre
// Google Maps u otra app compatible" · "no se requiere optimización
// automática de ruta" — un link de búsqueda simple es suficiente, sin
// integrar ningún SDK de mapas. Con coordenadas se usa el par lat,lng (más
// preciso, funciona incluso si la dirección es una referencia rural poco
// estandarizada); sin ellas, cae a una búsqueda por texto de la dirección.
export function enlaceMapa(entrega: {
  grupo_familiar_direccion: string
  grupo_familiar_sector: string
  grupo_familiar_latitud: number | null
  grupo_familiar_longitud: number | null
}): string {
  const query =
    entrega.grupo_familiar_latitud !== null && entrega.grupo_familiar_longitud !== null
      ? `${entrega.grupo_familiar_latitud},${entrega.grupo_familiar_longitud}`
      : `${entrega.grupo_familiar_direccion}, ${entrega.grupo_familiar_sector}, Coinco`

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
