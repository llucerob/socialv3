export type EstadoEntrega = 'pendiente' | 'realizada' | 'fallida'

export const ESTADO_ENTREGA_LABELS: Record<EstadoEntrega, string> = {
  pendiente: 'Pendiente',
  realizada: 'Realizada',
  fallida: 'Fallida',
}

// MR-06: en local, la persona retira la ayuda en el Departamento Social y
// se registra en el momento; a domicilio, bodega programa y terreno entrega.
export type ModalidadEntrega = 'domicilio' | 'local'

export const MODALIDAD_ENTREGA_LABELS: Record<ModalidadEntrega, string> = {
  domicilio: 'A domicilio',
  local: 'En local',
}

// US-19.03: los motivos de entrega fallida dejaron de ser un enum fijo —
// ahora son un catálogo administrable (lib/motivos-entrega), y motivo_fallo
// pasó a ser el uuid de la fila de motivos_entrega_fallida (antes, el valor
// del enum). motivo_fallo_nombre es el nombre ya resuelto por un join en el
// servidor (lib/entregas/dal.ts), para no obligar a cada pantalla a
// resolverlo aparte.
export type Entrega = {
  id: string
  solicitud_id: string
  estado: EstadoEntrega
  modalidad: ModalidadEntrega
  fecha_programada: string | null
  responsable_id: string | null
  responsable_nombre: string | null
  fecha_hora_entrega: string | null
  receptor_nombre: string | null
  receptor_relacion: string | null
  observacion_entrega: string | null
  motivo_fallo: string | null
  motivo_fallo_nombre: string | null
  observacion_fallo: string | null
  latitud: number | null
  longitud: number | null
  // US-13.04/US-13.02: orden sugerido (cálculo automático por cercanía) o
  // ajustado manualmente dentro del sector del hogar. Null hasta que el
  // sector de la entrega pase por un cálculo o un ajuste manual.
  orden_ruta: number | null
  // EPIC 27 (US-27.05/US-27.07): momento real de captura del resultado
  // (online u offline), distinto de updated_at (momento de escritura en
  // servidor). Null en filas anteriores a esta historia.
  capturado_en: string | null
  creado_por: string
  created_at: string
  updated_at: string
}

// Campos suficientes para US-12.03/US-20.02: dirección, beneficiario, ayuda
// y estado — sin motivo de solicitud, observaciones internas ni nada de
// evaluación social. grupo_familiar_latitud/longitud son las coordenadas del
// domicilio (US-03.06) — no confundir con Entrega.latitud/longitud, que es
// la ubicación donde se completó la entrega (US-12.07).
export type EntregaConContexto = Entrega & {
  grupo_familiar_id: string
  grupo_familiar_direccion: string
  grupo_familiar_sector: string
  grupo_familiar_latitud: number | null
  grupo_familiar_longitud: number | null
  tipo_ayuda_nombre: string
  // EPIC 27 (US-27.04): se embebe en el listado para que el modo offline
  // sepa si exigir evidencia sin tener que resolver la solicitud/tipo de
  // ayuda por separado (esa resolución, lib/solicitudes/dal.ts +
  // lib/ayudas/dal.ts, requiere red).
  tipo_ayuda_requiere_evidencia: boolean
  persona_nombre: string | null
}

export type FuncionarioTerreno = {
  id: string
  nombre: string
}

export type HistorialCambioEntrega = {
  id: string
  entrega_id: string
  campo: string
  valor_anterior: string | null
  valor_nuevo: string | null
  usuario_id: string | null
  creado_en: string
}

// EPIC 12 — lectura para roles que no gestionan entregas (evaluador_social,
// aprobador, finanzas, auditor_consulta) pero sí pueden ver el hogar o la
// solicitud dueña de la entrega. Ver 20260813000001_lectura_entregas_otros_roles.sql.
export type EntregaRealizadaDeHogar = {
  entrega_id: string
  solicitud_id: string
  tipo_ayuda_nombre: string
  persona_nombre: string | null
  modalidad: ModalidadEntrega
  fecha_hora_entrega: string | null
  receptor_nombre: string | null
  receptor_relacion: string | null
  observacion_entrega: string | null
  ruta: string
}

export type EntregaLecturaSolicitud = {
  entrega_id: string
  estado: EstadoEntrega
  modalidad: ModalidadEntrega
  fecha_programada: string | null
  responsable_nombre: string | null
  fecha_hora_entrega: string | null
  receptor_nombre: string | null
  receptor_relacion: string | null
  observacion_entrega: string | null
  motivo_fallo_nombre: string | null
  observacion_fallo: string | null
  latitud: number | null
  longitud: number | null
}

export type EntregaPendienteDashboard = {
  entrega_id: string
  solicitud_id: string
  tipo_ayuda_nombre: string
  direccion: string
  fecha_programada: string | null
  ruta: string
}
