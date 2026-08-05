-- RLS de documentos (US-10.01-US-10.04). A diferencia de hitos/evaluaciones
-- sociales (dato sensible, CLAUDE.md), EPIC 10 no exige por sí solo
-- restricción por rol específico — el maestro solo pide que no sean
-- "accesibles públicamente" (sección 43, ⚠️ nota de US-01.05). Se usa el
-- mismo patrón amplio que grupos_familiares/personas/tipos_ayuda/solicitudes:
-- cualquier rol válido puede ver y subir. La restricción fina por
-- sensibilidad de documento es EPIC 18 / US-18.02 (Sprint 7, no construido).
--
-- Sin update/delete: un documento subido no se reemplaza ni se borra en este
-- alcance (evita el problema de dejar storage.objects huérfanos sin una
-- historia que defina qué hacer con el archivo al borrar la fila).
alter table public.documentos enable row level security;

create policy "documentos_select_rol_valido"
on public.documentos
for select
to authenticated
using (public.current_role() is not null);

create policy "documentos_insert_rol_valido"
on public.documentos
for insert
to authenticated
with check (public.current_role() is not null);

grant select, insert on public.documentos to authenticated;

-- storage.objects: mismo criterio (rol válido), acotado al bucket
-- 'documentos' — storage.objects ya tiene RLS habilitado por Supabase de
-- fábrica, solo se agregan las políticas para este bucket.
create policy "documentos_storage_select_rol_valido"
on storage.objects
for select
to authenticated
using (bucket_id = 'documentos' and public.current_role() is not null);

create policy "documentos_storage_insert_rol_valido"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'documentos' and public.current_role() is not null);
