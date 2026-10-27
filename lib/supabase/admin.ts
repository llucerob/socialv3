import 'server-only'
import { createClient } from '@supabase/supabase-js'

// MR-02: cliente con la clave de servicio, solo para lo que la API pública
// de Auth no permite con la sesión del usuario (crear cuentas). Se salta la
// RLS: usarlo únicamente después de requireRole(['administrador']) y nunca
// para leer o escribir tablas de negocio.
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.')
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
