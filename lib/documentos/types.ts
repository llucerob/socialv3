export type TipoDocumento =
  | 'rsh'
  | 'certificado_medico'
  | 'certificado_dialisis'
  // 🆕 EPIC 25 (US-25.04): documento de respaldo del reembolso excepcional
  // por fallecimiento — la cirugía (US-25.01) reutiliza certificado_medico.
  | 'certificado_defuncion'
  | 'boleta'
  | 'comprobante'
  | 'fotografia'
  | 'informe_social'
  | 'otro'

export const TIPO_DOCUMENTO_LABELS: Record<TipoDocumento, string> = {
  rsh: 'RSH',
  certificado_medico: 'Certificado médico',
  certificado_dialisis: 'Certificado de diálisis',
  certificado_defuncion: 'Certificado de defunción',
  boleta: 'Boleta',
  comprobante: 'Comprobante',
  fotografia: 'Fotografía',
  informe_social: 'Informe social',
  otro: 'Otro',
}

export const TIPOS_DOCUMENTO: TipoDocumento[] = [
  'rsh',
  'certificado_medico',
  'certificado_dialisis',
  'certificado_defuncion',
  'boleta',
  'comprobante',
  'fotografia',
  'informe_social',
  'otro',
]

// US-14.02: "se puede marcar documento como válido/observado". No aplica a
// documentos en general (RSH, fotos de entrega, etc.) — la UI solo la
// expone para documentos de una solicitud de reembolso (ver US-14.02 en
// solicitudes/[id]/page.tsx), pero la columna vive en la tabla compartida
// porque es un atributo más del documento, no una entidad propia.
export type EstadoValidacionDocumento = 'pendiente' | 'valido' | 'observado'

export const ESTADO_VALIDACION_DOCUMENTO_LABELS: Record<EstadoValidacionDocumento, string> = {
  pendiente: 'Pendiente de validar',
  valido: 'Válido',
  observado: 'Observado',
}

// US-18.04: "estado de conservación" del documento, para preparar gestión
// futura de eliminación o bloqueo. Estados sugeridos por el backlog.
export type EstadoRetencionDocumento = 'vigente' | 'vencido' | 'reemplazado' | 'bloqueado' | 'eliminable'

export const ESTADO_RETENCION_DOCUMENTO_LABELS: Record<EstadoRetencionDocumento, string> = {
  vigente: 'Vigente',
  vencido: 'Vencido',
  reemplazado: 'Reemplazado',
  bloqueado: 'Bloqueado',
  eliminable: 'Eliminable',
}

export const ESTADOS_RETENCION_DOCUMENTO: EstadoRetencionDocumento[] = [
  'vigente',
  'vencido',
  'reemplazado',
  'bloqueado',
  'eliminable',
]

export type Documento = {
  id: string
  solicitud_id: string | null
  grupo_familiar_id: string | null
  tipo_documento: TipoDocumento
  storage_path: string
  nombre_archivo: string
  tamano_bytes: number
  mime_type: string
  subido_por: string
  estado_validacion: EstadoValidacionDocumento
  comentario_validacion: string | null
  validado_por: string | null
  validado_en: string | null
  estado_retencion: EstadoRetencionDocumento
  created_at: string
}

export type DocumentoConDetalle = Documento & {
  url: string | null
  subido_por_nombre: string | null
  validado_por_nombre: string | null
}
