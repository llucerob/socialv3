-- RLS de hitos (US-22.03). Mismo criterio que evaluaciones_sociales/
-- decisiones_solicitud: dato sensible según CLAUDE.md ("Hitos e informes
-- sociales son datos sensibles: requieren RLS restringido a evaluador
-- social/aprobador/administrador. Terreno, bodega y compras nunca acceden a
-- ellos."). finanzas y auditor_consulta tampoco están en la lista explícita,
-- por lo que quedan igualmente excluidos.
--
-- Sin políticas de update/delete: un hito registrado no se edita ni se
-- borra (mismo criterio que evaluaciones_sociales).
alter table public.hitos enable row level security;

create policy "hitos_select_gestion"
on public.hitos
for select
to authenticated
using (public.current_role() in ('administrador', 'evaluador_social', 'aprobador'));

create policy "hitos_insert_evaluador_o_admin"
on public.hitos
for insert
to authenticated
with check (public.current_role() in ('administrador', 'evaluador_social'));

grant select, insert on public.hitos to authenticated;

-- El registro de un intento denegado lo hace el propio usuario que fue
-- rechazado (ver requireRoleHitos en lib/hitos/dal.ts): cualquier
-- autenticado puede insertar su propio registro de auditoría, pero solo
-- administrador puede leer el log (mismo nivel que el resto de auditoría,
-- ver EPIC 16, todavía no construido).
alter table public.hitos_accesos_denegados enable row level security;

create policy "hitos_accesos_denegados_insert_propio"
on public.hitos_accesos_denegados
for insert
to authenticated
with check (usuario_id = auth.uid());

create policy "hitos_accesos_denegados_select_admin"
on public.hitos_accesos_denegados
for select
to authenticated
using (public.current_role() = 'administrador');

grant select, insert on public.hitos_accesos_denegados to authenticated;
