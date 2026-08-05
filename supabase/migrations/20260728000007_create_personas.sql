-- EPIC 04 — Gestión de personas integrantes del hogar (US-04.01)
-- Campos mínimos según US-04.01: RUT, nombres, apellidos, fecha de
-- nacimiento, parentesco, estado. `parentesco` es texto libre (el backlog no
-- define una lista cerrada, a diferencia de los roles en US-01.03).
--
-- Estados según US-04.03 (distintos de los sugeridos en docs/maestro.md
-- sección 6 — se sigue el backlog como fuente de verdad del MVP).
create type public.estado_persona as enum (
  'activo',
  'ya_no_pertenece_hogar',
  'fallecido',
  'pendiente_validacion'
);

create table public.personas (
  id uuid primary key default gen_random_uuid(),
  grupo_familiar_id uuid not null references public.grupos_familiares (id),
  rut text not null,
  nombres text not null,
  apellidos text not null,
  fecha_nacimiento date not null,
  parentesco text not null,
  estado public.estado_persona not null default 'activo',
  creado_por uuid not null default auth.uid() references auth.users (id),
  actualizado_por uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sin unique constraint sobre `rut`: US-04.01 pide "advertencia ante RUT
-- duplicado", no bloqueo. La verificación es a nivel de aplicación (lib/personas).
create index personas_rut_idx on public.personas (rut);
create index personas_grupo_familiar_id_idx on public.personas (grupo_familiar_id);

create trigger set_personas_updated_at
before update on public.personas
for each row
execute function public.set_updated_at();

create or replace function public.set_persona_actualizado_por()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_por = auth.uid();
  return new;
end;
$$;

create trigger set_personas_actualizado_por
before update on public.personas
for each row
execute function public.set_persona_actualizado_por();

-- Historial de cambios (US-04.02: "cambios sensibles auditados"; US-04.03:
-- "historial no se elimina"). Toda la ficha de una persona es dato sensible,
-- así que se audita cada campo editable, no un subconjunto.
create table public.personas_historial (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas (id) on delete cascade,
  campo text not null,
  valor_anterior text,
  valor_nuevo text,
  usuario_id uuid references auth.users (id),
  creado_en timestamptz not null default now()
);

create or replace function public.log_persona_cambio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.rut is distinct from old.rut then
    insert into public.personas_historial (persona_id, campo, valor_anterior, valor_nuevo, usuario_id)
    values (new.id, 'rut', old.rut, new.rut, auth.uid());
  end if;

  if new.nombres is distinct from old.nombres then
    insert into public.personas_historial (persona_id, campo, valor_anterior, valor_nuevo, usuario_id)
    values (new.id, 'nombres', old.nombres, new.nombres, auth.uid());
  end if;

  if new.apellidos is distinct from old.apellidos then
    insert into public.personas_historial (persona_id, campo, valor_anterior, valor_nuevo, usuario_id)
    values (new.id, 'apellidos', old.apellidos, new.apellidos, auth.uid());
  end if;

  if new.fecha_nacimiento is distinct from old.fecha_nacimiento then
    insert into public.personas_historial (persona_id, campo, valor_anterior, valor_nuevo, usuario_id)
    values (new.id, 'fecha_nacimiento', old.fecha_nacimiento::text, new.fecha_nacimiento::text, auth.uid());
  end if;

  if new.parentesco is distinct from old.parentesco then
    insert into public.personas_historial (persona_id, campo, valor_anterior, valor_nuevo, usuario_id)
    values (new.id, 'parentesco', old.parentesco, new.parentesco, auth.uid());
  end if;

  if new.estado is distinct from old.estado then
    insert into public.personas_historial (persona_id, campo, valor_anterior, valor_nuevo, usuario_id)
    values (new.id, 'estado', old.estado::text, new.estado::text, auth.uid());
  end if;

  return new;
end;
$$;

create trigger personas_audit_cambios
after update on public.personas
for each row
execute function public.log_persona_cambio();
