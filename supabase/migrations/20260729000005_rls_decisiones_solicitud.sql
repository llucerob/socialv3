-- RLS de decisiones_solicitud (EPIC 09). "Solo rol aprobador puede
-- aprobar/rechazar" (US-09.01/09.02) — se interpreta igual que el resto del
-- proyecto: administrador como superusuario también puede, evaluador_social
-- NO (a diferencia de otras tablas, aquí ni siquiera evaluador_social
-- escribe). Lectura: mismo criterio de dato sensible que evaluaciones_sociales.

alter table public.decisiones_solicitud enable row level security;

create policy "decisiones_solicitud_select_gestion"
on public.decisiones_solicitud
for select
to authenticated
using (public.current_role() in ('administrador', 'evaluador_social', 'aprobador'));

create policy "decisiones_solicitud_insert_aprobador_o_admin"
on public.decisiones_solicitud
for insert
to authenticated
with check (public.current_role() in ('administrador', 'aprobador'));

grant select, insert on public.decisiones_solicitud to authenticated;
