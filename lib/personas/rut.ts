// Validación de RUT chileno (US-04.01: "RUT válido"). Algoritmo de dígito
// verificador módulo 11, formato canónico de almacenamiento: "12345678-9".

function limpiar(rut: string): string {
  return rut.replace(/[.\s]/g, '').toUpperCase()
}

function calcularDv(cuerpo: string): string {
  let suma = 0
  let multiplo = 2

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplo
    multiplo = multiplo === 7 ? 2 : multiplo + 1
  }

  const resto = 11 - (suma % 11)
  if (resto === 11) return '0'
  if (resto === 10) return 'K'
  return String(resto)
}

function partes(rutInput: string): { cuerpo: string; dv: string } | null {
  const limpio = limpiar(rutInput)
  const match = limpio.match(/^(\d{7,8})-?([\dK])$/)
  if (!match) return null
  return { cuerpo: match[1], dv: match[2] }
}

export function rutEsValido(rutInput: string): boolean {
  const p = partes(rutInput)
  if (!p) return false
  return calcularDv(p.cuerpo) === p.dv
}

// Formato canónico para guardar en la base de datos. Devuelve null si el
// formato no es reconocible (llamar rutEsValido antes para el dígito verificador).
export function normalizarRut(rutInput: string): string | null {
  const p = partes(rutInput)
  if (!p) return null
  return `${p.cuerpo}-${p.dv}`
}
