import { ACCION_AUDITORIA_LABELS, type AccionAuditoria } from '@/lib/auditoria/types'

// Sistema de diseño Coinco — Tanda D (EPIC 17): tono semántico por tipo de
// acción del log de auditoría, agrupado en los 4 baldes que pide el prompt
// (creación/edición/eliminación/acceso). Presentación pura: no cambia qué
// se audita ni su contenido, solo el tono del badge ya calculado a partir
// del campo `accion` que ya devuelve listar_eventos_auditoria().
const ACCIONES_CREACION: AccionAuditoria[] = ['creacion', 'aprobacion', 'pago', 'entrada']
const ACCIONES_ELIMINACION_O_ACCESO: AccionAuditoria[] = ['eliminacion', 'rechazo', 'acceso_denegado', 'bloqueo_tope']

const CLASES_POR_TONO = {
  success: 'bg-success-bg text-success-fg',
  danger: 'bg-danger-bg text-danger-fg',
  neutral: 'bg-neutral-bg text-neutral-fg',
}

export function BadgeAccionAuditoria({ accion }: { accion: string }) {
  const esAccionValida = (valor: string): valor is AccionAuditoria => valor in ACCION_AUDITORIA_LABELS

  const tono = !esAccionValida(accion)
    ? 'neutral'
    : ACCIONES_CREACION.includes(accion)
      ? 'success'
      : ACCIONES_ELIMINACION_O_ACCESO.includes(accion)
        ? 'danger'
        : 'neutral'

  const label = esAccionValida(accion) ? ACCION_AUDITORIA_LABELS[accion] : accion

  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ring-1 ring-current/20 ring-inset ${CLASES_POR_TONO[tono]}`}>
      {label}
    </span>
  )
}
