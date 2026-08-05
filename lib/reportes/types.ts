// US-17.03: filtro "por tipo de reembolso" — mismos dos valores que
// distingue lib/reembolsos/tramos.ts, pero como slug corto para la URL
// (?tipo_reembolso=general|dialisis) en vez del nombre completo del catálogo.
export type TipoReembolsoFiltro = 'general' | 'dialisis'

export const TIPO_REEMBOLSO_LABELS: Record<TipoReembolsoFiltro, string> = {
  general: 'Reembolso médico general',
  dialisis: 'Reembolso médico por diálisis',
}

export type EstadoEntregaFiltroReporte = 'pendiente' | 'fallida'

export const ESTADO_ENTREGA_FILTRO_LABELS: Record<EstadoEntregaFiltroReporte, string> = {
  pendiente: 'Pendiente',
  fallida: 'Fallida',
}

// US-17.01
export type FilaAyudaEntregada = {
  solicitud_id: string
  fecha: string | null
  tipo_ayuda_id: string
  tipo_ayuda_nombre: string
  grupo_familiar_id: string
  sector: string
  direccion: string
  persona_nombre: string | null
  monto: number | null
  es_excepcion: boolean
  ruta: string
}

export type FiltrosAyudasEntregadas = {
  fechaDesde?: string
  fechaHasta?: string
  tipoAyudaId?: string
  sector?: string
}

// US-17.02
export type FilaHogarBeneficiado = {
  grupo_familiar_id: string
  direccion: string
  sector: string
  cantidad_ayudas: number
  fecha_ultima_ayuda: string | null
  ruta: string
}

export type FiltrosHogaresBeneficiados = {
  fechaDesde?: string
  fechaHasta?: string
  sector?: string
}

// US-17.03
export type FilaReembolsoMedico = {
  solicitud_id: string
  fecha_solicitud: string
  tipo_reembolso_nombre: string
  grupo_familiar_id: string
  direccion: string
  persona_nombre: string | null
  monto_solicitado: number | null
  monto_aprobado: number | null
  monto_pagado: number | null
  estado: string
  es_excepcion: boolean
  ruta: string
}

export type FiltrosReembolsosMedicos = {
  fechaDesde?: string
  fechaHasta?: string
  tipoReembolso?: TipoReembolsoFiltro
}

// 🆕 US-25.07 — reporte propio (no una rama de reporte_reembolsos_medicos,
// ver comentario en la migración), "se muestran por separado de los
// reembolsos generales y de diálisis · filtrable por tipo y por período".
export type TipoExcepcionFiltro = 'cirugia' | 'fallecimiento'

export const TIPO_EXCEPCION_LABELS: Record<TipoExcepcionFiltro, string> = {
  cirugia: 'Reembolso excepcional por cirugía',
  fallecimiento: 'Reembolso excepcional por fallecimiento o servicio funerario',
}

export type FilaReembolsoExcepcional = {
  solicitud_id: string
  fecha_solicitud: string
  tipo_excepcion: TipoExcepcionFiltro
  tipo_reembolso_nombre: string
  grupo_familiar_id: string
  direccion: string
  persona_nombre: string | null
  monto_solicitado: number | null
  monto_aprobado: number | null
  monto_pagado: number | null
  estado: string
  ruta: string
}

export type FiltrosReembolsosExcepcionales = {
  fechaDesde?: string
  fechaHasta?: string
  tipoExcepcion?: TipoExcepcionFiltro
}

// US-17.04
export type FilaDialisisMensual = {
  persona_id: string
  persona_nombre: string
  grupo_familiar_id: string
  anio: number
  mes: number
  monto_acumulado: number
  saldo_disponible: number
  tiene_excepcion: boolean
}

export type FiltrosDialisis = {
  anio?: number
  mes?: number
  personaId?: string
}

// US-17.05
export type FilaEntregaPendienteFallida = {
  entrega_id: string
  solicitud_id: string
  estado: string
  fecha_programada: string | null
  responsable_id: string | null
  responsable_nombre: string | null
  tipo_ayuda_nombre: string
  sector: string
  direccion: string
  motivo_fallo: string | null
  observacion_fallo: string | null
  ruta: string
}

export type FiltrosEntregasPendientesFallidas = {
  estado?: EstadoEntregaFiltroReporte
  responsableId?: string
  sector?: string
}
