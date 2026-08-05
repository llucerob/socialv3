-- EPIC 08 — Evaluación social (US-08.01)
-- Campos: fundamento, recomendación (aprobar/rechazar), asociada a la
-- solicitud, evaluador y fecha. "La evaluación no puede quedar vacía" se
-- refuerza con un CHECK además de la validación de la Server Action.
--
-- No se modela como editable: una evaluación registrada es un hecho
-- histórico (como un informe), no hay historia que pida editarla o
-- borrarla. Una solicitud puede tener varias evaluaciones a lo largo del
-- tiempo (ej. se observa, vuelve a evaluación, se evalúa de nuevo) — por
-- eso es una tabla 1-a-muchos, no una columna en solicitudes.
create type public.recomendacion_evaluacion as enum (
  'aprobar',
  'rechazar'
);

create table public.evaluaciones_sociales (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references public.solicitudes (id) on delete cascade,
  fundamento text not null check (length(trim(fundamento)) > 0),
  recomendacion public.recomendacion_evaluacion not null,
  evaluador_id uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);

create index evaluaciones_sociales_solicitud_id_idx on public.evaluaciones_sociales (solicitud_id);

-- Resuelve un nombre de perfil para mostrar en pantalla (ej. "evaluado por
-- X"). security definer: la RLS de profiles solo deja ver el propio perfil
-- o ser admin (US-01.05); esta función expone únicamente el nombre — no la
-- fila completa (rol/estado/email) — para no relajar esa RLS por un detalle
-- de visualización.
create or replace function public.nombre_usuario(p_user_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select nombre from public.profiles where id = p_user_id;
$$;

grant execute on function public.nombre_usuario(uuid) to authenticated;
