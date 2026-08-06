// US-03.06: "queda visualmente marcado como 'pendiente de georreferenciar'
// si no se completa". Mismo patrón que RshBadge.
export function GeorreferenciacionBadge({
  latitud,
  longitud,
}: {
  latitud: number | null
  longitud: number | null
}) {
  if (latitud !== null && longitud !== null) {
    return null
  }

  return (
    <span className="rounded-full bg-warning-bg px-2 py-0.5 text-xs whitespace-nowrap text-warning-fg">
      Pendiente de georreferenciar
    </span>
  )
}
