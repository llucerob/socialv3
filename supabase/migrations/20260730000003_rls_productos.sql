-- RLS de productos (US-11.01/US-11.04). A diferencia de grupos_familiares/
-- solicitudes (lectura amplia a cualquier rol válido), el maestro y el
-- backlog solo mencionan bodega/administrador como usuarios de este módulo
-- ("Como bodega o administrador, quiero ver stock disponible" — US-11.04),
-- así que también se restringe la lectura, no solo la escritura.
alter table public.productos enable row level security;

create policy "productos_select_bodega_o_admin"
on public.productos
for select
to authenticated
using (public.current_role() in ('administrador', 'bodega_logistica'));

create policy "productos_insert_bodega_o_admin"
on public.productos
for insert
to authenticated
with check (public.current_role() in ('administrador', 'bodega_logistica'));

create policy "productos_update_bodega_o_admin"
on public.productos
for update
to authenticated
using (public.current_role() in ('administrador', 'bodega_logistica'))
with check (public.current_role() in ('administrador', 'bodega_logistica'));

grant select, insert on public.productos to authenticated;

-- Restricción a nivel de columna (no solo de fila): stock_actual queda
-- deliberadamente fuera de este grant. Solo puede cambiar como efecto del
-- trigger de movimientos_stock (ver esa migración) — así "el stock aumenta/
-- disminuye automáticamente" (US-11.02/US-11.03) es una garantía de base de
-- datos y no una convención de la aplicación, y el valor nunca puede quedar
-- desincronizado del historial de movimientos que lo audita.
grant update (nombre, categoria, unidad_medida, stock_minimo) on public.productos to authenticated;
