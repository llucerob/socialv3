-- RLS de configuracion_rutas (US-13.04). Lectura: administrador y
-- bodega_logistica (quien dispara el cálculo de ruta necesita leer el
-- origen configurado, ver app/api/rutas/calcular-orden). Escritura: solo
-- administrador — es configuración de sistema, no gestión de casos, mismo
-- criterio que tipos_ayuda (US-06.02).
alter table public.configuracion_rutas enable row level security;

create policy "configuracion_rutas_select_logistica"
on public.configuracion_rutas
for select
to authenticated
using (public.current_role() in ('administrador', 'bodega_logistica'));

create policy "configuracion_rutas_update_admin_only"
on public.configuracion_rutas
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, update on public.configuracion_rutas to authenticated;
