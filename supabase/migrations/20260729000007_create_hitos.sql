-- EPIC 22 — Hitos del grupo familiar y del beneficiario (US-22.01, US-22.03).
-- Registro de hechos relevantes (familiar/social/salud) hecho por asistentes
-- sociales. Como una evaluación social, es un hecho histórico: no se edita
-- ni se borra una vez registrado (mismo criterio que evaluaciones_sociales).
create type public.tipo_hito as enum (
  'familiar',
  'social',
  'salud'
);

create table public.hitos (
  id uuid primary key default gen_random_uuid(),
  grupo_familiar_id uuid not null references public.grupos_familiares (id) on delete cascade,
  persona_id uuid references public.personas (id) on delete set null,
  tipo public.tipo_hito not null,
  -- Categoría es texto libre: el maestro (sección 51) señala que no existe
  -- todavía un mantenedor de tipos/categorías de hito, y no es un criterio
  -- de aceptación explícito de US-22.01 crear uno ahora.
  categoria text not null check (length(trim(categoria)) > 0),
  comentario text not null check (length(trim(comentario)) > 0),
  fecha_hito date not null,
  creado_por uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);

create index hitos_grupo_familiar_id_idx on public.hitos (grupo_familiar_id);
create index hitos_persona_id_idx on public.hitos (persona_id);

-- US-22.03, criterio "el intento de acceso no autorizado queda registrado en
-- auditoría". RLS de Postgres no distingue "denegado" de "sin filas" en un
-- select (ver nota en rls_hitos.sql) — por eso el registro del intento se
-- hace a nivel de aplicación (requireRoleHitos en lib/hitos/dal.ts), no
-- dentro de la política RLS. Esta tabla es el destino de ese registro.
create table public.hitos_accesos_denegados (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id),
  rol_en_intento text,
  grupo_familiar_id uuid references public.grupos_familiares (id) on delete set null,
  ruta text not null,
  creado_en timestamptz not null default now()
);

create index hitos_accesos_denegados_creado_en_idx on public.hitos_accesos_denegados (creado_en desc);
