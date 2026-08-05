-- Políticas RLS de personas y su historial (EPIC 04). Mismo criterio que
-- grupos_familiares (EPIC 03): lectura amplia, escritura solo evaluador
-- social/administrador.

alter table public.personas enable row level security;

create policy "personas_select_rol_valido"
on public.personas
for select
to authenticated
using (public.current_role() is not null);

create policy "personas_insert_evaluador_o_admin"
on public.personas
for insert
to authenticated
with check (public.current_role() in ('administrador', 'evaluador_social'));

create policy "personas_update_evaluador_o_admin"
on public.personas
for update
to authenticated
using (public.current_role() in ('administrador', 'evaluador_social'))
with check (public.current_role() in ('administrador', 'evaluador_social'));

grant select, insert, update on public.personas to authenticated;

alter table public.personas_historial enable row level security;

create policy "personas_historial_select_evaluador_o_admin"
on public.personas_historial
for select
to authenticated
using (public.current_role() in ('administrador', 'evaluador_social'));

grant select on public.personas_historial to authenticated;
