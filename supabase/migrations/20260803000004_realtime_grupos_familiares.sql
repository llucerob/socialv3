-- US-13.05: "el listado [de hogares pendientes de georreferenciar] se
-- actualiza en tiempo real conforme se van georreferenciando hogares" —
-- Supabase Realtime (postgres_changes) requiere que la tabla esté agregada
-- a la publicación supabase_realtime para emitir eventos. Sigue respetando
-- la RLS existente de grupos_familiares (select amplio a cualquier rol
-- activo válido): esto solo habilita el canal de notificación, no relaja
-- ningún permiso de lectura.
alter publication supabase_realtime add table public.grupos_familiares;
