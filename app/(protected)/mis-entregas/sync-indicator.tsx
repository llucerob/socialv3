'use client'

import { useEffect, useState } from 'react'
import { suscribirseSync, obtenerEstadoCola, type EstadoSyncGlobal } from '@/lib/offline/sync'

// US-27.06: "indicador visual simple (ícono o color) con al menos tres
// estados: sincronizado, pendiente, error de sincronización... se actualiza
// en tiempo real conforme se sincronizan los elementos" — se suscribe al
// motor de sincronización (lib/offline/sync.ts) en vez de sondear IndexedDB
// por su cuenta.
export function IndicadorSincronizacion() {
  const [estado, setEstado] = useState<EstadoSyncGlobal | null>(null)

  useEffect(() => {
    let activo = true
    obtenerEstadoCola().then((valor) => {
      if (activo) setEstado(valor)
    })
    const cancelarSuscripcion = suscribirseSync((valor) => {
      if (activo) setEstado(valor)
    })
    return () => {
      activo = false
      cancelarSuscripcion()
    }
  }, [])

  if (!estado) return null

  if (estado.errores > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-600/30 bg-red-600/10 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-red-600">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" />
        Error de sincronización ({estado.errores})
      </span>
    )
  }

  if (estado.pendientes > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-600/30 bg-amber-600/10 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-amber-700 dark:text-amber-500">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
        Pendiente de sincronizar ({estado.pendientes})
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-green-600/30 bg-green-600/10 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-green-700 dark:text-green-500">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" />
      Sincronizado
    </span>
  )
}
