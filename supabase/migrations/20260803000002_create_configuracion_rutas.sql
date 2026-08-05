-- US-13.04 — Recomendación técnica: "punto de origen configurable (por
-- ejemplo, la sede municipal o el punto de inicio del funcionario)". Tabla
-- singleton (un único registro, forzado por el check de la PK) en vez de un
-- mantenedor completo: no hay historia de backlog que pida múltiples puntos
-- de origen ni un catálogo administrable de ellos.
create table public.configuracion_rutas (
  id integer primary key default 1,
  origen_nombre text not null,
  origen_latitud numeric(10, 7) not null check (origen_latitud >= -90 and origen_latitud <= 90),
  origen_longitud numeric(10, 7) not null check (origen_longitud >= -180 and origen_longitud <= 180),
  actualizado_por uuid references auth.users (id),
  updated_at timestamptz not null default now(),
  constraint configuracion_rutas_singleton check (id = 1)
);

create or replace function public.set_configuracion_rutas_actualizado_por()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_por = auth.uid();
  return new;
end;
$$;

create trigger set_configuracion_rutas_updated_at
before update on public.configuracion_rutas
for each row
execute function public.set_updated_at();

create trigger set_configuracion_rutas_actualizado_por
before update on public.configuracion_rutas
for each row
execute function public.set_configuracion_rutas_actualizado_por();

-- Semilla con coordenadas aproximadas de la Municipalidad de Coinco (a
-- corregir por un administrador con la ubicación exacta desde
-- /rutas/configuracion) — el criterio de aceptación solo exige que el punto
-- de origen sea configurable, no que el valor inicial sea preciso.
insert into public.configuracion_rutas (id, origen_nombre, origen_latitud, origen_longitud)
values (1, 'Municipalidad de Coinco', -34.1500000, -70.9500000);
