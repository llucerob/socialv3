import { requireRole } from '@/lib/auth/dal'
import { obtenerConfiguracionRutas } from '@/lib/rutas/dal'
import { actualizarConfiguracionRutas } from '@/lib/rutas/actions'
import { ConfiguracionRutasForm } from './configuracion-rutas-form'

// US-13.04 (recomendación técnica): "punto de origen configurable" — solo
// administrador (configuración de sistema, no gestión de casos).
export default async function ConfiguracionRutasPage() {
  await requireRole(['administrador'])
  const configuracion = await obtenerConfiguracionRutas()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Configuración de rutas</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Punto de origen usado por el cálculo automático de orden de visitas (US-13.04) — por ejemplo, la sede
        municipal o el punto de inicio del funcionario.
      </p>
      <ConfiguracionRutasForm action={actualizarConfiguracionRutas} defaultValues={configuracion} />
    </div>
  )
}
