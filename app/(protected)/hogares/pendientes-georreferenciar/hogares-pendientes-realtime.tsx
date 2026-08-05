'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// US-13.05: "el listado se actualiza en tiempo real conforme se van
// georreferenciando hogares" — componente "headless" (no renderiza nada)
// que se suscribe a cambios en grupos_familiares vía Supabase Realtime y
// refresca la página (Server Component) cuando algo cambia. No duplica el
// filtrado/orden en el cliente: router.refresh() vuelve a pedir al servidor
// los mismos datos ya filtrados, ahora actualizados.
export function HogaresPendientesRealtime() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('hogares-pendientes-georreferenciar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grupos_familiares' }, () => {
        router.refresh()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  return null
}
