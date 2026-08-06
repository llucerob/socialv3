// Sistema de diseño Coinco — helper compartido para avatares con iniciales
// (topbar, colas de solicitudes). Extraído en el Prompt 2 para no duplicar
// la misma función en cada pantalla que necesita un avatar de iniciales.
export function iniciales(texto: string): string {
  const partes = texto.trim().split(/\s+/).filter(Boolean)
  const primera = partes[0]?.[0] ?? ''
  const segunda = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primera + segunda).toUpperCase()
}
