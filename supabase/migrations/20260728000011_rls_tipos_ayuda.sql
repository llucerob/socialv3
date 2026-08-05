-- RLS de tipos_ayuda (EPIC 06). US-06.02 es explícito: "modificación solo
-- por administrador" — a diferencia de grupos_familiares/personas, aquí
-- evaluador_social NO tiene permiso de escritura (es configuración del
-- sistema, no gestión de casos). Lectura amplia: cualquier rol válido
-- necesita conocer el catálogo (para crear solicitudes, evaluar, etc.).

alter table public.tipos_ayuda enable row level security;

create policy "tipos_ayuda_select_rol_valido"
on public.tipos_ayuda
for select
to authenticated
using (public.current_role() is not null);

create policy "tipos_ayuda_insert_admin_only"
on public.tipos_ayuda
for insert
to authenticated
with check (public.is_admin());

create policy "tipos_ayuda_update_admin_only"
on public.tipos_ayuda
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update on public.tipos_ayuda to authenticated;

alter table public.tipos_ayuda_historial enable row level security;

create policy "tipos_ayuda_historial_select_admin_only"
on public.tipos_ayuda_historial
for select
to authenticated
using (public.is_admin());

grant select on public.tipos_ayuda_historial to authenticated;
