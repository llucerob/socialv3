import { ESTADO_SOLICITUD_LABELS, type EstadoSolicitud } from '@/lib/solicitudes/types'
import { ESTADO_ENTREGA_LABELS, type EstadoEntrega } from '@/lib/entregas/types'
import { ESTADO_INCIDENTE_LABELS, type EstadoIncidenteSeguridad } from '@/lib/incidentes/types'
import { ESTADO_GRUPO_FAMILIAR_LABELS, type EstadoGrupoFamiliar } from '@/lib/hogares/types'
import { ESTADO_PERSONA_LABELS, type EstadoPersona } from '@/lib/personas/types'

// Sistema de diseño Coinco — badge de estado transversal. Cubre los estados
// REALES de los esquemas ya implementados (no se inventan nombres): 12
// estados de solicitudes (incluye reembolsos, que reutilizan EstadoSolicitud
// — no tienen enum propio), 3 de entregas, 2 de incidentes de seguridad, 2 de
// grupo familiar y 4 de persona (agregados en el Prompt 2 al vestir la ficha
// de hogar — ningún componente base los cubría todavía).
// `aprobada_excepcion` usa el tono `exception` (dorado, CLAUDE.md: "las
// excepciones nunca se ocultan") en vez de `success`, para que la excepción
// quede visualmente marcada también donde aparece como badge de estado.
export type EstadoBadgeValor =
  | EstadoSolicitud
  | EstadoEntrega
  | EstadoIncidenteSeguridad
  | EstadoGrupoFamiliar
  | EstadoPersona

type Tono = 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'exception'

const CLASES_POR_TONO: Record<Tono, string> = {
  brand: 'bg-brand-50 text-brand-800',
  success: 'bg-success-bg text-success-fg',
  warning: 'bg-warning-bg text-warning-fg',
  danger: 'bg-danger-bg text-danger-fg',
  neutral: 'bg-neutral-bg text-neutral-fg',
  exception: 'bg-exception-bg text-exception-fg ring-exception-border',
}

const TONO_POR_ESTADO: Record<EstadoBadgeValor, Tono> = {
  // Solicitudes (lib/solicitudes/types.ts)
  borrador: 'neutral',
  ingresada: 'brand',
  en_evaluacion: 'brand',
  observada: 'warning',
  aprobada: 'success',
  aprobada_excepcion: 'exception',
  pendiente_stock: 'warning',
  rechazada: 'danger',
  asignada_entrega_pago: 'brand',
  entregada_pagada: 'success',
  cerrada: 'neutral',
  anulada: 'neutral',
  // Entregas (lib/entregas/types.ts)
  pendiente: 'warning',
  realizada: 'success',
  fallida: 'danger',
  // Incidentes de seguridad (lib/incidentes/types.ts)
  abierto: 'brand',
  cerrado: 'neutral',
  // Grupo familiar (lib/hogares/types.ts) — 'activo' compartido con persona
  activo: 'success',
  inactivo: 'neutral',
  // Persona (lib/personas/types.ts)
  ya_no_pertenece_hogar: 'neutral',
  fallecido: 'neutral',
  pendiente_validacion: 'warning',
}

const LABEL_POR_ESTADO: Record<EstadoBadgeValor, string> = {
  ...ESTADO_SOLICITUD_LABELS,
  ...ESTADO_ENTREGA_LABELS,
  ...ESTADO_INCIDENTE_LABELS,
  ...ESTADO_GRUPO_FAMILIAR_LABELS,
  ...ESTADO_PERSONA_LABELS,
}

export function EstadoBadge({ estado }: { estado: EstadoBadgeValor }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ring-1 ring-current/20 ring-inset ${CLASES_POR_TONO[TONO_POR_ESTADO[estado]]}`}
    >
      {LABEL_POR_ESTADO[estado]}
    </span>
  )
}
