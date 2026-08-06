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
    <span className="rounded-full bg-warning-bg px-2 py-0.5 text-xs whitespace-nowrap text-warning-fg">
      {texto}
    </span>
  )
}
