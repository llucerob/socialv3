// Formato de visualización para fechas sin hora (columnas `date` de Postgres,
// que llegan como 'YYYY-MM-DD'). Se arma a mano en vez de usar
// `new Date(...).toLocaleDateString` porque esa conversión interpreta la
// fecha en UTC y, en Chile, la corre un día hacia atrás. Mismo orden
// día-mes-año que ya usan las marcas de tiempo vía toLocaleString('es-CL').
export function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return '—'
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha)
  if (!match) return fecha
  const [, anio, mes, dia] = match
  return `${dia}-${mes}-${anio}`
}

// Fecha de hoy en Chile, como 'YYYY-MM-DD' (mismo formato que las columnas
// `date`). No usar new Date().toISOString(): da la fecha en UTC, que en
// Chile ya es "mañana" desde las 21:00 (20:00 en verano) — una solicitud
// creada el 30 de noviembre de noche quedaría fuera del período de
// reembolso. Se fija la zona horaria (en vez de usar la del equipo) porque
// los formularios también se renderizan en el servidor.
const FORMATO_FECHA_CHILE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Santiago',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function fechaHoyChile(ahora: Date = new Date()): string {
  return FORMATO_FECHA_CHILE.format(ahora)
}
