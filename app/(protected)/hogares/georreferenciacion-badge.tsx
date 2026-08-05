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
    <span className="rounded-full border border-amber-600/30 bg-amber-600/10 px-2 py-0.5 text-xs whitespace-nowrap text-amber-700 dark:text-amber-500">
      Pendiente de georreferenciar
    </span>
  )
}
