-- RLS de pagos_reembolso (US-14.04). "Solo finanzas o administrador puede
-- registrar pago" — escritura acotada a esos dos roles. Lectura: el resto
-- de roles de gestión del caso (evaluador_social, aprobador) también deben
-- poder ver que el reembolso ya fue pagado en el detalle de la solicitud.
alter table public.pagos_reembolso enable row level security;

create policy "pagos_reembolso_select_gestion"
on public.pagos_reembolso
for select
to authenticated
using (public.current_role() in ('administrador', 'evaluador_social', 'aprobador', 'finanzas'));

create policy "pagos_reembolso_insert_finanzas_o_admin"
on public.pagos_reembolso
for insert
to authenticated
with check (public.current_role() in ('administrador', 'finanzas'));

grant select, insert on public.pagos_reembolso to authenticated;

-- finanzas necesita leer decisiones_solicitud (monto_aprobado) para
-- registrar el pago y para que la UI muestre "monto aprobado: $X" antes de
-- pagar — esa política no incluía este rol todavía (EPIC 09 es anterior a
-- que finanzas tuviera cualquier permiso en el sistema).
drop policy "decisiones_solicitud_select_gestion" on public.decisiones_solicitud;

create policy "decisiones_solicitud_select_gestion"
on public.decisiones_solicitud
for select
to authenticated
using (public.current_role() in ('administrador', 'evaluador_social', 'aprobador', 'finanzas'));
