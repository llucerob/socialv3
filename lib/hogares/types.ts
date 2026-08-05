export type EstadoGrupoFamiliar = 'activo' | 'inactivo'

export type GrupoFamiliar = {
  id: string
  direccion: string
  sector: string
  telefono: string | null
  tramo_rsh: number | null
  fecha_actualizacion_rsh: string | null
  observaciones: string | null
  // US-03.06: opcionales — un hogar sin coordenadas opera con normalidad,
  // solo queda excluido del cálculo de ruta (US-13.04, no construido todavía).
  latitud: number | null
  longitud: number | null
  estado: EstadoGrupoFamiliar
  creado_por: string
  actualizado_por: string | null
  created_at: string
  updated_at: string
}

export type HistorialCambioGrupoFamiliar = {
  id: string
  grupo_familiar_id: string
  campo: string
  valor_anterior: string | null
  valor_nuevo: string | null
  usuario_id: string | null
  creado_en: string
}
