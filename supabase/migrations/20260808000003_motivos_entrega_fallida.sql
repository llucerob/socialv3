-- US-19.03 — Administrar motivos de entrega fallida.
-- "Se pueden crear motivos" es incompatible con el enum fijo
-- motivo_fallo_entrega (EPIC 12): un enum de Postgres solo se extiende con
-- una migración, no en tiempo de ejecución por un administrador. Esta
-- migración convierte entregas.motivo_fallo de enum a FK contra un catálogo
-- nuevo — es la primera conversión enum→catálogo del proyecto (antes solo
-- existía el patrón "agregar un valor a un enum ya creado", ver
-- 20260730000001_add_pendiente_stock_estado_solicitud.sql).
create type public.estado_motivo_entrega_fallida as enum ('activo', 'inactivo');

create table public.motivos_entrega_fallida (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  estado public.estado_motivo_entrega_fallida not null default 'activo',
  -- Nullable (mismo criterio que tipos_ayuda, ver 20260728000009_create_tipos_ayuda.sql):
  -- el catálogo inicial se siembra más abajo vía migración, sin un usuario
  -- autenticado real — auth.uid() resuelve a null en ese contexto, así que
  -- "not null" rechazaría la propia semilla de esta migración.
  creado_por uuid default auth.uid() references auth.users (id),
  actualizado_por uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_motivos_entrega_fallida_updated_at
before update on public.motivos_entrega_fallida
for each row
execute function public.set_updated_at();

create or replace function public.set_motivo_entrega_fallida_actualizado_por()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_por = auth.uid();
  return new;
end;
$$;

create trigger set_motivos_entrega_fallida_actualizado_por
before update on public.motivos_entrega_fallida
for each row
execute function public.set_motivo_entrega_fallida_actualizado_por();

create table public.motivos_entrega_fallida_historial (
  id uuid primary key default gen_random_uuid(),
  motivo_id uuid not null references public.motivos_entrega_fallida (id) on delete cascade,
  campo text not null,
  valor_anterior text,
  valor_nuevo text,
  usuario_id uuid references auth.users (id),
  creado_en timestamptz not null default now()
);

create or replace function public.log_motivo_entrega_fallida_cambio()
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
      insert into public.motivos_entrega_fallida_historial (motivo_id, campo, valor_anterior, valor_nuevo, usuario_id)
      values (new.id, campo, to_jsonb(old) ->> campo, to_jsonb(new) ->> campo, auth.uid());
    end if;
  end loop;

  return new;
end;
$$;

create trigger motivos_entrega_fallida_audit_cambios
after update on public.motivos_entrega_fallida
for each row
execute function public.log_motivo_entrega_fallida_cambio();

-- "La vista de terreno usa estos motivos": terreno_repartidor necesita
-- lectura (para poblar el <select> de "marcar entrega fallida") — lectura
-- amplia a cualquier rol válido, escritura solo administrador. Mismo
-- criterio que tipos_ayuda/sectores.
alter table public.motivos_entrega_fallida enable row level security;

create policy "motivos_entrega_fallida_select_rol_valido"
on public.motivos_entrega_fallida
for select
to authenticated
using (public.current_role() is not null);

create policy "motivos_entrega_fallida_insert_admin_only"
on public.motivos_entrega_fallida
for insert
to authenticated
with check (public.is_admin());

create policy "motivos_entrega_fallida_update_admin_only"
on public.motivos_entrega_fallida
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update on public.motivos_entrega_fallida to authenticated;

alter table public.motivos_entrega_fallida_historial enable row level security;

create policy "motivos_entrega_fallida_historial_select_admin_only"
on public.motivos_entrega_fallida_historial
for select
to authenticated
using (public.is_admin());

grant select on public.motivos_entrega_fallida_historial to authenticated;

-- Semilla: mismos 5 motivos que ya existían como enum, con su etiqueta
-- humana ya usada en MOTIVO_FALLO_LABELS (lib/entregas/types.ts) como
-- `nombre` — "los motivos históricos se conservan": las entregas ya
-- marcadas como fallidas antes de esta migración deben seguir mostrando el
-- motivo correcto después de convertir la columna.
insert into public.motivos_entrega_fallida (nombre) values
  ('No hay moradores'),
  ('Dirección incorrecta'),
  ('Beneficiario rechaza la ayuda'),
  ('Ayuda no disponible'),
  ('Otro');

-- Conversión de la columna: agrega la FK nueva, la rellena a partir del
-- valor de enum existente, elimina la columna de enum y renombra la FK a su
-- lugar — para que ningún nombre de columna cambie (entregas.motivo_fallo
-- sigue llamándose igual, solo cambia su tipo de enum a uuid).
alter table public.entregas
  add column motivo_fallo_nuevo uuid references public.motivos_entrega_fallida (id);

update public.entregas
set motivo_fallo_nuevo = (
  select m.id
  from public.motivos_entrega_fallida m
  where m.nombre = case entregas.motivo_fallo::text
    when 'no_hay_moradores' then 'No hay moradores'
    when 'direccion_incorrecta' then 'Dirección incorrecta'
    when 'beneficiario_rechaza' then 'Beneficiario rechaza la ayuda'
    when 'ayuda_no_disponible' then 'Ayuda no disponible'
    when 'otro' then 'Otro'
  end
)
where motivo_fallo is not null;

alter table public.entregas drop column motivo_fallo;
alter table public.entregas rename column motivo_fallo_nuevo to motivo_fallo;

drop type public.motivo_fallo_entrega;

-- El trigger genérico de entregas_historial (to_jsonb(new)->>campo) seguía
-- funcionando sin cambios tras la conversión, pero registraría el uuid crudo
-- en vez del nombre legible del motivo — se agrega un caso especial solo
-- para 'motivo_fallo' que resuelve el nombre del catálogo, preservando la
-- legibilidad del historial que ya existía cuando motivo_fallo era un enum.
-- Mismas columnas auditadas que la versión anterior (20260803000001), en el
-- mismo orden.
create or replace function public.log_entrega_cambio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  campo text;
  valor_anterior text;
  valor_nuevo text;
begin
  foreach campo in array array[
    'estado', 'responsable_id', 'fecha_programada', 'motivo_fallo', 'orden_ruta'
  ]
  loop
    if to_jsonb(new) ->> campo is distinct from to_jsonb(old) ->> campo then
      if campo = 'motivo_fallo' then
        select nombre into valor_anterior from public.motivos_entrega_fallida where id = old.motivo_fallo;
        select nombre into valor_nuevo from public.motivos_entrega_fallida where id = new.motivo_fallo;
      else
        valor_anterior := to_jsonb(old) ->> campo;
        valor_nuevo := to_jsonb(new) ->> campo;
      end if;

      insert into public.entregas_historial (entrega_id, campo, valor_anterior, valor_nuevo, usuario_id)
      values (new.id, campo, valor_anterior, valor_nuevo, auth.uid());
    end if;
  end loop;

  return new;
end;
$$;

-- Actualiza el reporte de EPIC 17 (US-17.05) para que siga devolviendo un
-- motivo legible (antes: `e.motivo_fallo::text` sobre el enum: ahora un
-- join contra el catálogo). Misma firma y forma de retorno que la versión
-- original (20260806000001_reportes_fn.sql) — create or replace conserva el
-- grant existente porque no cambian los tipos de los parámetros.
create or replace function public.reporte_entregas_pendientes_fallidas(
  p_estado text default null,
  p_responsable_id uuid default null,
  p_sector text default null,
  p_limite integer default 500
)
returns table (
  entrega_id uuid,
  solicitud_id uuid,
  estado text,
  fecha_programada date,
  responsable_id uuid,
  responsable_nombre text,
  tipo_ayuda_nombre text,
  sector text,
  direccion text,
  motivo_fallo text,
  observacion_fallo text,
  ruta text
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if public.current_role() not in ('administrador', 'bodega_logistica') then
    raise exception 'No autorizado';
  end if;

  if p_estado is not null and p_estado not in ('pendiente', 'fallida') then
    raise exception 'Estado inválido: %', p_estado;
  end if;

  return query
  select
    e.id as entrega_id,
    e.solicitud_id,
    e.estado::text,
    e.fecha_programada,
    e.responsable_id,
    public.nombre_usuario(e.responsable_id) as responsable_nombre,
    ta.nombre as tipo_ayuda_nombre,
    gf.sector,
    gf.direccion,
    mf.nombre as motivo_fallo,
    e.observacion_fallo,
    ('/solicitudes/' || e.solicitud_id) as ruta
  from public.entregas e
  join public.solicitudes s on s.id = e.solicitud_id
  join public.tipos_ayuda ta on ta.id = s.tipo_ayuda_id
  join public.grupos_familiares gf on gf.id = s.grupo_familiar_id
  left join public.motivos_entrega_fallida mf on mf.id = e.motivo_fallo
  where e.estado in ('pendiente', 'fallida')
    and (p_estado is null or e.estado::text = p_estado)
    and (p_responsable_id is null or e.responsable_id = p_responsable_id)
    and (p_sector is null or gf.sector = p_sector)
  order by e.fecha_programada nulls last, e.created_at
  limit p_limite;
end;
$$;
