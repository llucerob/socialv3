export type PagoReembolso = {
  id: string
  solicitud_id: string
  fecha_pago: string
  monto_pagado: number
  medio_pago: string
  observacion: string | null
  registrado_por: string
  created_at: string
}

export type PagoReembolsoConNombre = PagoReembolso & {
  registrado_por_nombre: string | null
}

// US-14.05: resultado del cálculo automático de tramo + tope para un
// reembolso médico general. `topeFinal` es "el menor valor entre (a) el
// tope teórico del tramo... y (b) el remanente disponible del pool anual"
// — el único número que realmente debe usarse para validar la aprobación
// (US-14.06).
export type TopeReembolsoGeneral = {
  numeroReembolso: number
  topeTramo: number
  remanenteAnual: number
  topeFinal: number
  bloqueadoPorTramos: boolean
}

// US-15.03: acumulado mensual de diálisis de una persona beneficiaria —
// "el sistema muestra acumulado actual" / "saldo disponible del mes".
export type AcumuladoDialisisMensual = {
  acumuladoMensual: number
  saldoDisponible: number
}
