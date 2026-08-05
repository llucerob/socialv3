-- 🆕 EPIC 24 — Compras municipales (fuera del MVP estricto, P2).
-- US-24.01 — Registrar proveedor: "registro de nombre, RUT, contacto;
-- listado de proveedores activos". Mismo patrón de catálogo administrable
-- que sectores/motivos_entrega_fallida (EPIC 19): nombre, estado
-- activo/inactivo, historial de cambios vía trigger genérico.
--
-- Público de lectura/escritura: administrador y bodega_logistica (no
-- "cualquier rol válido" como tipos_ayuda/sectores) — mismo criterio que
-- productos/movimientos_stock (EPIC 11): el maestro y el backlog solo
-- mencionan bodega/administrador como usuarios de compras e inventario.
create type public.estado_proveedor as enum ('activo', 'inactivo');

create table public.proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  rut text not null unique,
  contacto text,
  estado public.estado_proveedor not null default 'activo',
  creado_por uuid not null default auth.uid() references auth.users (id),
  actualizado_por uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_proveedores_updated_at
before update on public.proveedores
for each row
execute function public.set_updated_at();

create or replace function public.set_proveedor_actualizado_por()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_por = auth.uid();
  return new;
end;
$$;

create trigger set_proveedores_actualizado_por
before update on public.proveedores
for each row
execute function public.set_proveedor_actualizado_por();

create table public.proveedores_historial (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references public.proveedores (id) on delete cascade,
  campo text not null,
  valor_anterior text,
  valor_nuevo text,
  usuario_id uuid references auth.users (id),
  creado_en timestamptz not null default now()
);

create or replace function public.log_proveedor_cambio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  campo text;
begin
  foreach campo in array array['nombre', 'rut', 'contacto', 'estado']
  loop
    if to_jsonb(new) ->> campo is distinct from to_jsonb(old) ->> campo then
      insert into public.proveedores_historial (proveedor_id, campo, valor_anterior, valor_nuevo, usuario_id)
      values (new.id, campo, to_jsonb(old) ->> campo, to_jsonb(new) ->> campo, auth.uid());
    end if;
  end loop;

  return new;
end;
$$;

create trigger proveedores_audit_cambios
after update on public.proveedores
for each row
execute function public.log_proveedor_cambio();

alter table public.proveedores enable row level security;

create policy "proveedores_select_bodega_o_admin"
on public.proveedores
for select
to authenticated
using (public.current_role() in ('administrador', 'bodega_logistica'));

create policy "proveedores_insert_bodega_o_admin"
on public.proveedores
for insert
to authenticated
with check (public.current_role() in ('administrador', 'bodega_logistica'));

create policy "proveedores_update_bodega_o_admin"
on public.proveedores
for update
to authenticated
using (public.current_role() in ('administrador', 'bodega_logistica'))
with check (public.current_role() in ('administrador', 'bodega_logistica'));

grant select, insert, update on public.proveedores to authenticated;

alter table public.proveedores_historial enable row level security;

create policy "proveedores_historial_select_bodega_o_admin"
on public.proveedores_historial
for select
to authenticated
using (public.current_role() in ('administrador', 'bodega_logistica'));

grant select on public.proveedores_historial to authenticated;
