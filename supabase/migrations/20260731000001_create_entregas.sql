-- EPIC 12 — Entregas en domicilio y evidencia (US-12.01 a US-12.05, US-12.07).
-- Una entrega por solicitud (unique en solicitud_id): "puede ser
-- reprogramada" (US-12.05) se modela como la MISMA fila volviendo a
-- 'pendiente' con una nueva fecha_programada, no como una fila nueva — así
-- el ciclo pendiente → fallida → pendiente (reprogramada) → realizada queda
-- completo en un solo registro, auditado por entregas_historial (ver abajo).
create type public.estado_entrega as enum ('pendiente', 'realizada', 'fallida');

create type public.motivo_fallo_entrega as enum (
  'no_hay_moradores',
  'direccion_incorrecta',
  'beneficiario_rechaza',
  'ayuda_no_disponible',
  'otro'
);

create table public.entregas (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null unique references public.solicitudes (id),
  estado public.estado_entrega not null default 'pendiente',
  fecha_programada date,
  -- US-12.02: "se puede seleccionar responsable" — nullable porque US-12.01
  -- permite crear la entrega sin asignar todavía (asignación es una acción
  -- separada, posterior).
  responsable_id uuid references auth.users (id),
  -- US-12.04: datos de la entrega realizada. Nulos hasta que estado='realizada'.
  fecha_hora_entrega timestamptz,
  receptor_nombre text,
  receptor_relacion text,
  observacion_entrega text,
  -- US-12.05: datos de la entrega fallida. Nulos hasta que estado='fallida'.
  -- No se limpian al reprogramar: quedan como el motivo del último intento
  -- fallido, y el historial (entregas_historial) preserva la secuencia
  -- completa de todos modos.
  motivo_fallo public.motivo_fallo_entrega,
  observacion_fallo text,
  -- US-12.07: ubicación opcional de la entrega realizada.
  latitud numeric(9, 6),
  longitud numeric(9, 6),
  creado_por uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index entregas_responsable_id_idx on public.entregas (responsable_id);
create index entregas_estado_idx on public.entregas (estado);

create trigger set_entregas_updated_at
before update on public.entregas
for each row
execute function public.set_updated_at();

-- Historial (US-12.02: "la asignación queda registrada" · US-12.04: "la
-- acción queda auditada" · US-12.05: "la acción queda en historial"). Mismo
-- patrón que solicitudes_historial/grupos_familiares_historial.
create table public.entregas_historial (
  id uuid primary key default gen_random_uuid(),
  entrega_id uuid not null references public.entregas (id) on delete cascade,
  campo text not null,
  valor_anterior text,
  valor_nuevo text,
  usuario_id uuid references auth.users (id),
  creado_en timestamptz not null default now()
);

create or replace function public.log_entrega_cambio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  campo text;
begin
  foreach campo in array array[
    'estado', 'responsable_id', 'fecha_programada', 'motivo_fallo'
  ]
  loop
    if to_jsonb(new) ->> campo is distinct from to_jsonb(old) ->> campo then
      insert into public.entregas_historial (entrega_id, campo, valor_anterior, valor_nuevo, usuario_id)
      values (new.id, campo, to_jsonb(old) ->> campo, to_jsonb(new) ->> campo, auth.uid());
    end if;
  end loop;

  return new;
end;
$$;

create trigger entregas_audit_cambios
after update on public.entregas
for each row
execute function public.log_entrega_cambio();

-- Lista de funcionarios asignables (US-12.02: "se puede seleccionar
-- responsable"). security definer: la RLS de profiles (US-01.05) solo deja
-- ver el propio perfil o ser admin — esta función expone únicamente id y
-- nombre de terreno_repartidor activos (no el resto de la fila), igual
-- criterio que nombre_usuario().
create or replace function public.listar_funcionarios_terreno()
returns table (id uuid, nombre text)
language sql
security definer
stable
set search_path = public
as $$
  select id, nombre
  from public.profiles
  where rol = 'terreno_repartidor'
    and estado = 'activo'
  order by nombre;
$$;

grant execute on function public.listar_funcionarios_terreno() to authenticated;
