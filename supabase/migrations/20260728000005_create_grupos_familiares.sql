-- EPIC 03 — Gestión de grupos familiares (US-03.01)
-- El grupo familiar es la unidad de gestión central del sistema (ver CLAUDE.md).
-- Campos mínimos según US-03.01: dirección, sector, teléfono, tramo RSH,
-- fecha de actualización RSH, observaciones, estado.
--
-- No incluye coordenadas (lat/lng): eso es US-03.06 (fuera de alcance de esta
-- migración) ni un catálogo de sectores (mantenedor futuro, US-19.02) — por
-- ahora `sector` es texto libre.

create type public.estado_grupo_familiar as enum (
  'activo',
  'inactivo'
);

create table public.grupos_familiares (
  id uuid primary key default gen_random_uuid(),
  direccion text not null,
  sector text not null,
  telefono text,
  tramo_rsh numeric(5, 2) check (tramo_rsh >= 0 and tramo_rsh <= 100),
  fecha_actualizacion_rsh date,
  observaciones text,
  estado public.estado_grupo_familiar not null default 'activo',
  creado_por uuid not null default auth.uid() references auth.users (id),
  actualizado_por uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_grupos_familiares_updated_at
before update on public.grupos_familiares
for each row
execute function public.set_updated_at();

-- Registra quién hizo la última modificación (US-03.03: "fecha y usuario de
-- modificación"). updated_at ya lo cubre set_updated_at (reutilizado de profiles).
create or replace function public.set_grupo_familiar_actualizado_por()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_por = auth.uid();
  return new;
end;
$$;

create trigger set_grupos_familiares_actualizado_por
before update on public.grupos_familiares
for each row
execute function public.set_grupo_familiar_actualizado_por();

-- Historial de cambios críticos (US-03.03: "cambios críticos auditados").
-- tramo_rsh y estado son críticos porque determinan elegibilidad y si el
-- hogar puede recibir ayudas — no un log de auditoría genérico (eso es
-- EPIC 16, fuera de alcance aquí).
create table public.grupos_familiares_historial (
  id uuid primary key default gen_random_uuid(),
  grupo_familiar_id uuid not null references public.grupos_familiares (id) on delete cascade,
  campo text not null,
  valor_anterior text,
  valor_nuevo text,
  usuario_id uuid references auth.users (id),
  creado_en timestamptz not null default now()
);

-- security definer: el usuario que edita el hogar no tiene (ni debe tener)
-- grant de insert directo sobre el historial; solo se escribe vía este trigger.
create or replace function public.log_grupo_familiar_cambio_critico()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tramo_rsh is distinct from old.tramo_rsh then
    insert into public.grupos_familiares_historial
      (grupo_familiar_id, campo, valor_anterior, valor_nuevo, usuario_id)
    values
      (new.id, 'tramo_rsh', old.tramo_rsh::text, new.tramo_rsh::text, auth.uid());
  end if;

  if new.estado is distinct from old.estado then
    insert into public.grupos_familiares_historial
      (grupo_familiar_id, campo, valor_anterior, valor_nuevo, usuario_id)
    values
      (new.id, 'estado', old.estado::text, new.estado::text, auth.uid());
  end if;

  return new;
end;
$$;

create trigger grupos_familiares_audit_cambios_criticos
after update on public.grupos_familiares
for each row
execute function public.log_grupo_familiar_cambio_critico();
