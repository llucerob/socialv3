-- EPIC 07 — Solicitudes de ayuda (US-07.01)
-- Campos mínimos: hogar, tipo de ayuda, persona beneficiaria si aplica,
-- fecha, motivo, observaciones. "Documentos si aplica" queda pendiente de
-- EPIC 10 (no existe almacenamiento de documentos todavía).
--
-- El enum de estado incluye los 11 "estados mínimos" de US-07.06 completos
-- (borrador...anulada), aunque esta migración solo construye la lógica para
-- borrador/ingresada/en_evaluacion/anulada — el resto (observada, aprobada,
-- rechazada, asignada_entrega_pago, entregada_pagada, cerrada) pertenece a
-- EPIC 08/09/12/14, que aún no existen. Se define el enum completo ahora
-- porque es una decisión de esquema, no de lógica de negocio.
create type public.estado_solicitud as enum (
  'borrador',
  'ingresada',
  'en_evaluacion',
  'observada',
  'aprobada',
  'aprobada_excepcion',
  'rechazada',
  'asignada_entrega_pago',
  'entregada_pagada',
  'cerrada',
  'anulada'
);

create table public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  grupo_familiar_id uuid not null references public.grupos_familiares (id),
  tipo_ayuda_id uuid not null references public.tipos_ayuda (id),
  persona_id uuid references public.personas (id),
  fecha_solicitud date not null default current_date,
  motivo text not null,
  observaciones text,
  estado public.estado_solicitud not null default 'borrador',
  creado_por uuid not null default auth.uid() references auth.users (id),
  actualizado_por uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index solicitudes_grupo_familiar_id_idx on public.solicitudes (grupo_familiar_id);
create index solicitudes_estado_idx on public.solicitudes (estado);

create trigger set_solicitudes_updated_at
before update on public.solicitudes
for each row
execute function public.set_updated_at();

create or replace function public.set_solicitud_actualizado_por()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_por = auth.uid();
  return new;
end;
$$;

create trigger set_solicitudes_actualizado_por
before update on public.solicitudes
for each row
execute function public.set_solicitud_actualizado_por();

-- Historial (US-07.06: mecanismo de cambio de estado; US-05.04: "la
-- validación [RSH] queda registrada en auditoría"). Se auditan estado,
-- tipo_ayuda_id y persona_id — no motivo/observaciones/fecha, igual de
-- criterio que grupos_familiares (solo lo crítico para el caso).
create table public.solicitudes_historial (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references public.solicitudes (id) on delete cascade,
  campo text not null,
  valor_anterior text,
  valor_nuevo text,
  usuario_id uuid references auth.users (id),
  creado_en timestamptz not null default now()
);

create or replace function public.log_solicitud_cambio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  campo text;
begin
  foreach campo in array array['estado', 'tipo_ayuda_id', 'persona_id']
  loop
    if to_jsonb(new) ->> campo is distinct from to_jsonb(old) ->> campo then
      insert into public.solicitudes_historial (solicitud_id, campo, valor_anterior, valor_nuevo, usuario_id)
      values (new.id, campo, to_jsonb(old) ->> campo, to_jsonb(new) ->> campo, auth.uid());
    end if;
  end loop;

  return new;
end;
$$;

create trigger solicitudes_audit_cambios
after update on public.solicitudes
for each row
execute function public.log_solicitud_cambio();

-- US-05.04: registra el resultado de la validación RSH al enviar a
-- evaluación, incluso cuando NO cambia ninguna columna (ej. queda bloqueada).
-- security definer: el usuario autenticado no tiene grant de insert directo
-- sobre el historial, igual que el resto de las tablas *_historial.
--
-- IMPORTANTE: al ser security definer, esta función se ejecuta con
-- privilegios elevados sin pasar por RLS. El chequeo de rol de abajo NO es
-- opcional: sin él, cualquier usuario autenticado (con cualquier rol) podría
-- llamar esta función por REST directamente e inyectar entradas falsas en el
-- historial de auditoría de cualquier solicitud.
create or replace function public.registrar_validacion_rsh_solicitud(
  p_solicitud_id uuid,
  p_resultado text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_role() not in ('administrador', 'evaluador_social') then
    raise exception 'No autorizado';
  end if;

  insert into public.solicitudes_historial (solicitud_id, campo, valor_anterior, valor_nuevo, usuario_id)
  values (p_solicitud_id, 'validacion_rsh', null, p_resultado, auth.uid());
end;
$$;

grant execute on function public.registrar_validacion_rsh_solicitud(uuid, text) to authenticated;
