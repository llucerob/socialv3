export type TipoHito = 'familiar' | 'social' | 'salud'

export const TIPO_HITO_LABELS: Record<TipoHito, string> = {
  familiar: 'Familiar',
  social: 'Social',
  salud: 'Salud',
}

// US-22.02: "se puede filtrar por tipo de hito".
export const TIPOS_HITO: TipoHito[] = ['familiar', 'social', 'salud']

export type Hito = {
  id: string
  grupo_familiar_id: string
  persona_id: string | null
  tipo: TipoHito
  categoria: string
  comentario: string
  fecha_hito: string
  creado_por: string
  created_at: string
}

export type HitoConNombres = Hito & {
  creado_por_nombre: string | null
  persona_nombre: string | null
}
