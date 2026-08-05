// US-13.04 (recomendación técnica): punto de origen configurable para el
// cálculo de orden por cercanía.
export type ConfiguracionRutas = {
  id: number
  origen_nombre: string
  origen_latitud: number
  origen_longitud: number
  actualizado_por: string | null
  updated_at: string
}
