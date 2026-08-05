import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { ConfiguracionRutas } from './types'

// Tabla singleton (id siempre 1, ver create_configuracion_rutas.sql).
const ID_CONFIGURACION = 1

// US-13.04: punto de origen configurable para el cálculo de ruta ("por
// ejemplo, la sede municipal o el punto de inicio del funcionario").
export async function obtenerConfiguracionRutas(): Promise<ConfiguracionRutas> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('configuracion_rutas')
    .select('*')
    .eq('id', ID_CONFIGURACION)
    .single()

  if (error) throw error
  return data as ConfiguracionRutas
}
