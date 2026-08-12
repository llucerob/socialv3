export type EstadoSolicitud =
  | 'borrador'
  | 'ingresada'
  | 'en_evaluacion'
  | 'observada'
  | 'aprobada'
  | 'aprobada_excepcion'
  // US-11.03: sin stock suficiente para la salida asociada a esta solicitud.
  | 'pendiente_stock'
  | 'rechazada'
  | 'asignada_entrega_pago'
  | 'entregada_pagada'
  | 'cerrada'
  | 'anulada'

export const ESTADO_SOLICITUD_LABELS: Record<EstadoSolicitud, string> = {
  borrador: 'Borrador',
  ingresada: 'Ingresada',
  en_evaluacion: 'En evaluación',
  observada: 'Observada',
  aprobada: 'Aprobada',
  aprobada_excepcion: 'Aprobada por excepción',
  pendiente_stock: 'Pendiente de stock',
  rechazada: 'Rechazada',
  asignada_entrega_pago: 'Asignada para entrega/pago',
  entregada_pagada: 'Entregada/pagada',
  cerrada: 'Cerrada',
  anulada: 'Anulada',
}

export type Solicitud = {
  id: string
  grupo_familiar_id: string
  tipo_ayuda_id: string
  persona_id: string | null
  fecha_solicitud: string
  motivo: string
  observaciones: string | null
  // US-09.03: solo relevante para ayudas de tipo 'reembolso' (tipos_ayuda.tipo).
  monto_solicitado: number | null
  estado: EstadoSolicitud
  creado_por: string
  actualizado_por: string | null
  created_at: string
  updated_at: string
}

export type SolicitudConRelaciones = Solicitud & {
  grupo_familiar_direccion: string
  grupo_familiar_sector: string
  grupo_familiar_tramo_rsh: number | null
  tipo_ayuda_nombre: string
  // lib/ayudas/types.ts: TipoAyuda.tipo ('material' | 'reembolso', texto
  // libre) — necesario para poder filtrar solicitudes de reembolso sin
  // depender del nombre exacto del tipo de ayuda.
  tipo_ayuda_tipo: string
  persona_nombre: string | null
}

export type HistorialCambioSolicitud = {
  id: string
  solicitud_id: string
  campo: string
  valor_anterior: string | null
  valor_nuevo: string | null
  usuario_id: string | null
  creado_en: string
}
