import 'server-only'

// US-17.06: serialización CSV compartida por los cinco reportes exportables
// — evita reimplementar el escapado de comas/comillas/saltos de línea en
// cada uno.
export function filasACsv(
  encabezados: string[],
  filas: (string | number | boolean | null)[][]
): string {
  const escapar = (valor: string | number | boolean | null): string => {
    if (valor === null || valor === undefined) return ''
    const texto = String(valor)
    return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
  }

  return [encabezados, ...filas].map((fila) => fila.map(escapar).join(',')).join('\r\n')
}
