-- EPIC 01 — Autenticación, usuarios y roles (US-01.02, US-01.03)

create type public.rol_usuario as enum (
  'administrador',
  'evaluador_social',
  'aprobador',
  'bodega_logistica',
  'terreno_repartidor',
  'finanzas',
  'auditor_consulta'
);

create type public.estado_usuario as enum (
  'activo',
  'inactivo'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  email text not null,
  rol public.rol_usuario,
  estado public.estado_usuario not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- El acceso a profiles siempre pasa por RLS (ver migración de políticas);
-- solo se otorgan privilegios a 'authenticated'. 'anon' no recibe grants.
grant select, update on public.profiles to authenticated;
