-- US-19.02 — Administrar sectores.
-- "Se pueden crear/editar/desactivar sectores" — catálogo nuevo, mismo
-- patrón que tipos_ayuda (EPIC 06): nombre único, estado activo/inactivo,
-- auditoría de cambios vía tabla *_historial + trigger genérico.
--
-- "Los hogares pueden asociarse a un sector": grupos_familiares.sector sigue
-- siendo `text` (no se convierte a FK) — es un campo usado como texto libre
-- en ~10 lugares distintos del sistema (agrupación de entregas por sector,
-- rutas, los tres reportes de EPIC 17, etc., todos comparando por igualdad
-- exacta de texto) y ninguno de esos consumidores necesita cambiar: el
-- formulario de hogar (US-19.02) pasa de un <input> libre a un <select> con
-- las opciones de este catálogo, así que en adelante el valor de
-- grupos_familiares.sector queda restringido en la práctica a nombres del
-- catálogo sin tocar ni el esquema ni ningún consumidor existente.
create type public.estado_sector as enum ('activo', 'inactivo');

create table public.sectores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  estado public.estado_sector not null default 'activo',
  creado_por uuid not null default auth.uid() references auth.users (id),
  actualizado_por uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_sectores_updated_at
before update on public.sectores
for each row
execute function public.set_updated_at();

create or replace function public.set_sector_actualizado_por()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_por = auth.uid();
  return new;
end;
$$;

create trigger set_sectores_actualizado_por
before update on public.sectores
for each row
execute function public.set_sector_actualizado_por();

create table public.sectores_historial (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid not null references public.sectores (id) on delete cascade,
  campo text not null,
  valor_anterior text,
  valor_nuevo text,
  usuario_id uuid references auth.users (id),
  creado_en timestamptz not null default now()
);

create or replace function public.log_sector_cambio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  campo text;
begin
  foreach campo in array array['nombre', 'estado']
  loop
    if to_jsonb(new) ->> campo is distinct from to_jsonb(old) ->> campo then
      insert into public.sectores_historial (sector_id, campo, valor_anterior, valor_nuevo, usuario_id)
      values (new.id, campo, to_jsonb(old) ->> campo, to_jsonb(new) ->> campo, auth.uid());
    end if;
  end loop;

  return new;
end;
$$;

create trigger sectores_audit_cambios
after update on public.sectores
for each row
execute function public.log_sector_cambio();

-- Lectura amplia (cualquier rol válido: el formulario de hogar, filtros de
-- entregas/reportes, etc. necesitan poblar el <select> de sectores activos
-- desde cualquier módulo) — escritura solo administrador. Mismo criterio que
-- tipos_ayuda.
alter table public.sectores enable row level security;

create policy "sectores_select_rol_valido"
on public.sectores
for select
to authenticated
using (public.current_role() is not null);

create policy "sectores_insert_admin_only"
on public.sectores
for insert
to authenticated
with check (public.is_admin());

create policy "sectores_update_admin_only"
on public.sectores
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update on public.sectores to authenticated;

alter table public.sectores_historial enable row level security;

create policy "sectores_historial_select_admin_only"
on public.sectores_historial
for select
to authenticated
using (public.is_admin());

grant select on public.sectores_historial to authenticated;

-- Backfill: siembra el catálogo con los sectores ya en uso por hogares
-- existentes, para que el <select> del formulario de hogar no empiece vacío
-- ni deje huérfano ningún hogar ya creado con un sector de texto libre.
insert into public.sectores (nombre)
select distinct sector
from public.grupos_familiares
where sector is not null and length(trim(sector)) > 0
on conflict (nombre) do nothing;
