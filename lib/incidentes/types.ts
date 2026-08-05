// US-26.01: "el tipo de incidente se elige desde un catálogo simple".
export type TipoIncidenteSeguridad =
  | 'acceso_no_autorizado'
  | 'perdida_documento'
  | 'filtracion'
  | 'uso_indebido_credenciales'
  | 'otro'

export const TIPO_INCIDENTE_LABELS: Record<TipoIncidenteSeguridad, string> = {
  acceso_no_autorizado: 'Acceso no autorizado',
  perdida_documento: 'Pérdida de documento',
  filtracion: 'Filtración',
  uso_indebido_credenciales: 'Uso indebido de credenciales',
  otro: 'Otro',
}

export const TIPOS_INCIDENTE: TipoIncidenteSeguridad[] = [
  'acceso_no_autorizado',
  'perdida_documento',
  'filtracion',
  'uso_indebido_credenciales',
  'otro',
]

export type EstadoIncidenteSeguridad = 'abierto' | 'cerrado'

export const ESTADO_INCIDENTE_LABELS: Record<EstadoIncidenteSeguridad, string> = {
  abierto: 'Abierto',
  cerrado: 'Cerrado',
}

export const ESTADOS_INCIDENTE: EstadoIncidenteSeguridad[] = ['abierto', 'cerrado']

// US-26.04: "destinatario (Agencia / titulares / ambos)".
export type DestinatarioNotificacionIncidente = 'agencia' | 'titulares' | 'ambos'

export const DESTINATARIO_NOTIFICACION_LABELS: Record<DestinatarioNotificacionIncidente, string> = {
  agencia: 'Agencia de Protección de Datos',
  titulares: 'Titulares afectados',
  ambos: 'Agencia y titulares afectados',
}

export type IncidenteSeguridad = {
  id: string
  fecha_incidente: string
  usuario_involucrado_id: string | null
  tipo: TipoIncidenteSeguridad
  datos_afectados: string
  cantidad_personas_afectadas: number
  medidas_correctivas: string | null
  responsable_seguimiento_id: string
  estado: EstadoIncidenteSeguridad
  notificacion_fecha: string | null
  notificacion_destinatario: DestinatarioNotificacionIncidente | null
  notificacion_responsable_id: string | null
  creado_por: string
  created_at: string
  updated_at: string
}

export type IncidenteSeguridadConNombres = IncidenteSeguridad & {
  usuario_involucrado_nombre: string | null
  responsable_seguimiento_nombre: string | null
  notificacion_responsable_nombre: string | null
}

export type HistorialCambioIncidente = {
  id: string
  incidente_id: string
  campo: string
  valor_anterior: string | null
  valor_nuevo: string | null
  usuario_id: string | null
  creado_en: string
}
