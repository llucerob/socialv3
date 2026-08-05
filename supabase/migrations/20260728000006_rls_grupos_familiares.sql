-- Políticas RLS de grupos_familiares y su historial de cambios (EPIC 03).
--
-- Lectura: cualquier usuario autenticado con rol activo válido (casi todos los
-- módulos futuros necesitan leer el hogar: entregas, reembolsos, aprobación,
-- auditoría). Escritura: solo evaluador_social y administrador, que son
-- quienes registran/editan hogares en terreno o en oficina.

alter table public.grupos_familiares enable row level security;

create policy "grupos_familiares_select_rol_valido"
on public.grupos_familiares
for select
to authenticated
using (public.current_role() is not null);

create policy "grupos_familiares_insert_evaluador_o_admin"
on public.grupos_familiares
for insert
to authenticated
with check (public.current_role() in ('administrador', 'evaluador_social'));

create policy "grupos_familiares_update_evaluador_o_admin"
on public.grupos_familiares
for update
to authenticated
using (public.current_role() in ('administrador', 'evaluador_social'))
with check (public.current_role() in ('administrador', 'evaluador_social'));

grant select, insert, update on public.grupos_familiares to authenticated;

-- Historial: mismo público que puede editar (es donde se revisan los cambios
-- críticos). Sin grant de insert: solo lo escribe el trigger security definer.
alter table public.grupos_familiares_historial enable row level security;

create policy "grupos_familiares_historial_select_evaluador_o_admin"
on public.grupos_familiares_historial
for select
to authenticated
using (public.current_role() in ('administrador', 'evaluador_social'));

grant select on public.grupos_familiares_historial to authenticated;
