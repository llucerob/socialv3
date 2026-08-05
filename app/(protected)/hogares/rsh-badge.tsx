import { evaluarEstadoRsh } from '@/lib/hogares/rsh'

export function RshBadge({
  tramoRsh,
  fechaActualizacionRsh,
}: {
  tramoRsh: number | null
  fechaActualizacionRsh: string | null
}) {
  const estado = evaluarEstadoRsh(tramoRsh, fechaActualizacionRsh)

  if (estado.tipo === 'vigente') {
    return null
  }

  const texto =
    estado.tipo === 'sin_registrar'
      ? 'RSH pendiente de actualización'
      : `RSH desactualizado (hace ${estado.meses} meses)`

  return (
    <span className="rounded-full border border-amber-600/30 bg-amber-600/10 px-2 py-0.5 text-xs whitespace-nowrap text-amber-700 dark:text-amber-500">
      {texto}
    </span>
  )
}
