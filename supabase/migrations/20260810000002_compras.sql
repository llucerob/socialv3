-- US-24.02 — Registrar compra municipal. "Campos mínimos" del backlog, sin
-- lista de criterios de aceptación propia (a diferencia del resto de
-- historias del proyecto) — se interpreta como: el registro se puede crear
-- con estos campos y queda consultable en un listado, mismo estándar
-- mínimo que cualquier otra historia de "registrar X" de este backlog.
--
-- "Documento tributario asociado" se modela como texto libre (folio o
-- número de factura/boleta), no como un archivo adjunto: la historia no
-- pide "subir" ni "adjuntar" nada (a diferencia de, por ejemplo, US-12.06
-- "subir evidencia"), y `documentos` (EPIC 10) exige asociarse a
-- exactamente una solicitud o un hogar — una compra no es ninguna de las
-- dos, así que reutilizar esa tabla habría requerido romper su check
-- `documentos_una_entidad_check` para un caso no pedido explícitamente.
--
-- Sin update/delete ni tabla de historial: es un registro histórico
-- inmutable, mismo criterio que movimientos_stock (EPIC 11) — una compra
-- mal registrada no se corrige retroactivamente.
create table public.compras (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos (id),
  proveedor_id uuid not null references public.proveedores (id),
  numero_orden_compra text not null,
  fecha_compra date not null,
  -- Nullable: la compra se registra al emitir la orden; la recepción puede
  -- confirmarse después (o nunca, si se anula en la práctica fuera del
  -- sistema — no hay un estado explícito pedido por la historia).
  fecha_recepcion date,
  cantidad integer not null check (cantidad > 0),
  valor_unitario numeric(12, 2) not null check (valor_unitario >= 0),
  valor_total numeric(12, 2) not null check (valor_total >= 0),
  documento_tributario text,
  registrado_por uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);

create index compras_producto_id_idx on public.compras (producto_id);
create index compras_proveedor_id_idx on public.compras (proveedor_id);

alter table public.compras enable row level security;

create policy "compras_select_bodega_o_admin"
on public.compras
for select
to authenticated
using (public.current_role() in ('administrador', 'bodega_logistica'));

create policy "compras_insert_bodega_o_admin"
on public.compras
for insert
to authenticated
with check (public.current_role() in ('administrador', 'bodega_logistica'));

grant select, insert on public.compras to authenticated;

-- US-24.03 — "el ingreso de stock (US-11.02) puede referenciar una compra
-- registrada". Nullable y exclusiva de entradas (una salida nunca proviene
-- de una compra) — mismo criterio que movimientos_stock.solicitud_id, que
-- ya está acotado a salidas por un check análogo.
alter table public.movimientos_stock
  add column compra_id uuid references public.compras (id);

alter table public.movimientos_stock
  add constraint movimientos_stock_compra_solo_entrada
  check (tipo = 'entrada' or compra_id is null);
