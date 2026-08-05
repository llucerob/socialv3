-- RLS de entregas (EPIC 12). "Como bodega o logística" gestiona (crear,
-- asignar, reprogramar) — mismo rol que EPIC 11. "Como funcionario en
-- terreno" solo ve y actúa sobre SUS PROPIAS entregas asignadas (US-12.03:
-- "el funcionario ve solo sus entregas").
alter table public.entregas enable row level security;

create policy "entregas_select_bodega_o_admin"
on public.entregas
for select
to authenticated
using (public.current_role() in ('administrador', 'bodega_logistica'));

create policy "entregas_select_terreno_propia"
on public.entregas
for select
to authenticated
using (public.current_role() = 'terreno_repartidor' and responsable_id = auth.uid());

create policy "entregas_insert_bodega_o_admin"
on public.entregas
for insert
to authenticated
with check (public.current_role() in ('administrador', 'bodega_logistica'));

-- Bodega/administrador gestionan la entrega en general (asignar, reprogramar).
create policy "entregas_update_bodega_o_admin"
on public.entregas
for update
to authenticated
using (public.current_role() in ('administrador', 'bodega_logistica'))
with check (public.current_role() in ('administrador', 'bodega_logistica'));

-- Terreno solo puede modificar la entrega que tiene asignada (registrar
-- resultado: US-12.04/US-12.05/US-12.07). Qué columnas puede tocar en cada
-- acción lo decide la Server Action (lib/entregas/actions.ts), igual
-- criterio que el resto del proyecto (ver documentos/hitos).
create policy "entregas_update_terreno_propia"
on public.entregas
for update
to authenticated
using (public.current_role() = 'terreno_repartidor' and responsable_id = auth.uid())
with check (public.current_role() = 'terreno_repartidor' and responsable_id = auth.uid());

grant select, insert, update on public.entregas to authenticated;

-- Historial: mismo público que gestiona (bodega/administrador). Terreno no
-- lo necesita para su propio flujo (ve el estado actual, no el historial de
-- transiciones), y no es un dato de la ficha del hogar (a diferencia de
-- hitos), así que no se amplía a otros roles.
alter table public.entregas_historial enable row level security;

create policy "entregas_historial_select_bodega_o_admin"
on public.entregas_historial
for select
to authenticated
using (public.current_role() in ('administrador', 'bodega_logistica'));

grant select on public.entregas_historial to authenticated;
