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
