export type EstadoPersona =
  | 'activo'
  | 'ya_no_pertenece_hogar'
  | 'fallecido'
  | 'pendiente_validacion'

export const ESTADO_PERSONA_LABELS: Record<EstadoPersona, string> = {
  activo: 'Activo',
  ya_no_pertenece_hogar: 'Ya no pertenece al hogar',
  fallecido: 'Fallecido',
  pendiente_validacion: 'Pendiente de validación',
}

export type Persona = {
  id: string
  grupo_familiar_id: string
  rut: string
  nombres: string
  apellidos: string
  fecha_nacimiento: string
  parentesco: string
  estado: EstadoPersona
  creado_por: string
  actualizado_por: string | null
  created_at: string
  updated_at: string
}

export type HistorialCambioPersona = {
  id: string
  persona_id: string
  campo: string
  valor_anterior: string | null
  valor_nuevo: string | null
  usuario_id: string | null
  creado_en: string
}
