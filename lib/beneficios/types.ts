import type { EstadoEntrega, ModalidadEntrega } from '@/lib/entregas/types'

// MR-08: la aprobación de una caja de mercadería o de pañales otorga un
// beneficio que se entrega cada período, desde el mes de aprobación hasta el
// 31 de diciembre. El calendario lo calcula la base (calendario_beneficio):
// en una entrega intermitente, retirar con atraso (dentro del plazo) corre
// las siguientes; lo que no se retira a tiempo se pierde.
export type PeriodicidadBeneficio = 'mensual' | 'mes_por_medio' | 'semestral'

export const PERIODICIDADES_BENEFICIO: PeriodicidadBeneficio[] = ['mensual', 'mes_por_medio', 'semestral']

export const PERIODICIDAD_BENEFICIO_LABELS: Record<PeriodicidadBeneficio, string> = {
  mensual: 'Mensual',
  mes_por_medio: 'Mes por medio',
  semestral: 'Semestral',
}

// 'completado' y 'vencido' los deriva listar_beneficios(): en la tabla solo
// existen 'vigente' y 'suspendido'.
export type EstadoBeneficio = 'vigente' | 'suspendido' | 'completado' | 'vencido'

export const ESTADO_BENEFICIO_LABELS: Record<EstadoBeneficio, string> = {
  vigente: 'Vigente',
  suspendido: 'Suspendido',
  completado: 'Completado',
  vencido: 'Vencido',
}

export type ResumenBeneficio = {
  beneficio_id: string
  solicitud_id: string
  grupo_familiar_id: string
  tipo_ayuda_nombre: string
  persona_nombre: string | null
  periodicidad: PeriodicidadBeneficio
  modalidad: ModalidadEntrega
  vigente_desde: string
  vigente_hasta: string
  estado: EstadoBeneficio
  es_excepcion: boolean
  motivo_suspension: string | null
  total_periodos: number
  periodos_entregados: number
  // Plazo vencido sin retiro: se pierden, no se entregan después.
  periodos_no_entregados: number
  ultima_entrega: string | null
  proximo_periodo: string | null
}

// 'por_venir' es estimado: si la entrega abierta se retira con atraso, las
// siguientes se recalculan desde ese mes.
export type EstadoPeriodo = 'entregado' | 'no_entregado' | 'abierto' | 'por_venir' | 'cancelado'

export type PeriodoBeneficio = {
  // Mes en que le corresponde la entrega.
  periodo: string
  // Último mes en que todavía se puede retirar (en mensual, el mismo mes).
  ventana_hasta: string
  estado_periodo: EstadoPeriodo
  // Mes real en que se entregó (puede ser posterior a `periodo`).
  mes_entrega: string | null
  entrega_id: string | null
  estado_entrega: EstadoEntrega | null
  modalidad: ModalidadEntrega | null
  fecha_programada: string | null
  fecha_hora_entrega: string | null
  responsable_nombre: string | null
  receptor_nombre: string | null
  salida_registrada: boolean
}

export type PeriodoPorPreparar = {
  solicitud_id: string
  tipo_ayuda_nombre: string
  direccion: string
  sector: string
  persona_nombre: string | null
  periodo: string
  ventana_hasta: string
  modalidad: ModalidadEntrega
  es_excepcion: boolean
  salida_registrada: boolean
  estado_entrega: EstadoEntrega | null
  ruta: string
}

export type HistorialCambioBeneficio = {
  id: string
  beneficio_id: string
  campo: string
  valor_anterior: string | null
  valor_nuevo: string | null
  motivo: string | null
  usuario_id: string | null
  creado_en: string
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

// Un período es el primer día de su mes ('2026-09-01'): "septiembre 2026".
export function etiquetaPeriodo(periodo: string): string {
  const [anio, mes] = periodo.split('-').map(Number)
  return `${MESES[mes - 1]} ${anio}`
}

// En la URL el período va como '2026-09' (?periodo=); en la base, como fecha.
export function periodoDesdeParametro(parametro: string | undefined): string | null {
  return parametro && /^\d{4}-(0[1-9]|1[0-2])$/.test(parametro) ? `${parametro}-01` : null
}

export function parametroDePeriodo(periodo: string): string {
  return periodo.slice(0, 7)
}

// Errores con prefijo fijo de las funciones y triggers de MR-08.
export const ERRORES_BENEFICIO: Record<string, string> = {
  PERIODICIDAD_OBLIGATORIA: 'Selecciona la periodicidad del beneficio.',
  PERIODO_OBLIGATORIO: 'Indica el período del beneficio al que corresponde.',
  PERIODO_SIN_BENEFICIO: 'Esta solicitud no es un beneficio periódico.',
  PERIODO_FUERA_DE_BENEFICIO: 'Ese período no corresponde al calendario del beneficio.',
  PERIODO_FUTURO: 'Ese período todavía no comienza: no se puede entregar antes de su mes.',
  PERIODO_VENCIDO: 'El plazo para retirar ese período ya pasó: los meses atrasados no se entregan.',
  PERIODO_YA_ENTREGADO: 'Ese período ya fue entregado.',
  BENEFICIO_VENCIDO: 'El beneficio venció el 31 de diciembre: no hay entregas después de esa fecha. El hogar necesita una nueva solicitud.',
  BENEFICIO_SUSPENDIDO: 'El beneficio está suspendido.',
  BENEFICIO_NO_ENCONTRADO: 'Esta solicitud no tiene un beneficio periódico.',
  BENEFICIO_NO_VIGENTE: 'Solo se puede cambiar la modalidad de un beneficio vigente.',
  BENEFICIO_YA_SUSPENDIDO: 'El beneficio ya estaba suspendido.',
  MODALIDAD_SIN_CAMBIO: 'El beneficio ya tiene esa modalidad.',
  MOTIVO_OBLIGATORIO: 'El motivo es obligatorio.',
  NO_PERMITE_ENTREGA_LOCAL: 'Este tipo de ayuda no permite entrega en local.',
}

export function mensajeErrorBeneficio(mensaje: string | undefined): string | null {
  const codigo = Object.keys(ERRORES_BENEFICIO).find((clave) => mensaje?.includes(clave))
  return codigo ? ERRORES_BENEFICIO[codigo] : null
}
