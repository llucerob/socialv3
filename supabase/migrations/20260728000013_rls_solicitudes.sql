-- RLS de solicitudes (EPIC 07). Mismo criterio que grupos_familiares/personas:
-- lectura amplia (aprobador, bodega, finanzas, etc. necesitarán ver
-- solicitudes en sus propios EPICs futuros), escritura solo evaluador_social
-- y administrador (son quienes gestionan el caso en esta etapa).

alter table public.solicitudes enable row level security;

create policy "solicitudes_select_rol_valido"
on public.solicitudes
for select
to authenticated
using (public.current_role() is not null);

create policy "solicitudes_insert_evaluador_o_admin"
on public.solicitudes
for insert
to authenticated
with check (public.current_role() in ('administrador', 'evaluador_social'));

create policy "solicitudes_update_evaluador_o_admin"
on public.solicitudes
for update
to authenticated
using (public.current_role() in ('administrador', 'evaluador_social'))
with check (public.current_role() in ('administrador', 'evaluador_social'));

grant select, insert, update on public.solicitudes to authenticated;

alter table public.solicitudes_historial enable row level security;

create policy "solicitudes_historial_select_evaluador_o_admin"
on public.solicitudes_historial
for select
to authenticated
using (public.current_role() in ('administrador', 'evaluador_social'));

grant select on public.solicitudes_historial to authenticated;
