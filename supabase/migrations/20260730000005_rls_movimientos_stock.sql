-- RLS de movimientos_stock (US-11.02/US-11.03). Misma audiencia que
-- productos: solo bodega/administrador. Sin update ni delete: es un
-- registro histórico inmutable (US-11.02: "el movimiento queda auditado").
alter table public.movimientos_stock enable row level security;

create policy "movimientos_stock_select_bodega_o_admin"
on public.movimientos_stock
for select
to authenticated
using (public.current_role() in ('administrador', 'bodega_logistica'));

create policy "movimientos_stock_insert_bodega_o_admin"
on public.movimientos_stock
for insert
to authenticated
with check (public.current_role() in ('administrador', 'bodega_logistica'));

grant select, insert on public.movimientos_stock to authenticated;
