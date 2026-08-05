// US-05.01 / US-05.03: estado del tramo RSH de un hogar. No requiere
// migración nueva — tramo_rsh y fecha_actualizacion_rsh ya existen desde
// US-03.01; esto solo deriva un estado visual a partir de esos datos.

// US-05.03: "umbral de meses configurable". No existe un módulo de
// administración (EPIC 20) para exponerlo en la UI todavía, así que queda
// como constante ajustable en código hasta que ese EPIC exista.
export const UMBRAL_MESES_RSH_DESACTUALIZADO = 12

export function mesesDesde(fechaIso: string, ahora: Date = new Date()): number {
  const fecha = new Date(fechaIso)
  return (ahora.getFullYear() - fecha.getFullYear()) * 12 + (ahora.getMonth() - fecha.getMonth())
}

export type EstadoRsh =
  | { tipo: 'sin_registrar' }
  | { tipo: 'desactualizado'; meses: number }
  | { tipo: 'vigente' }

export function evaluarEstadoRsh(
  tramoRsh: number | null,
  fechaActualizacionRsh: string | null,
  umbralMeses: number = UMBRAL_MESES_RSH_DESACTUALIZADO
): EstadoRsh {
  if (tramoRsh === null || !fechaActualizacionRsh) {
    return { tipo: 'sin_registrar' }
  }

  const meses = mesesDesde(fechaActualizacionRsh)
  if (meses >= umbralMeses) {
    return { tipo: 'desactualizado', meses }
  }

  return { tipo: 'vigente' }
}

// US-05.04: regla de elegibilidad general del proyecto (ver CLAUDE.md — "un
// hogar con tramo RSH > 40% no puede aprobarse por flujo regular"). Es una
// constante de negocio fija, distinta del umbral de tiempo de arriba.
export const UMBRAL_ELEGIBILIDAD_RSH = 40

export function superaUmbralElegibilidad(tramoRsh: number | null): boolean {
  return tramoRsh !== null && tramoRsh > UMBRAL_ELEGIBILIDAD_RSH
}
