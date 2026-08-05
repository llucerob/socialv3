-- EPIC 09 — Aprobación y rechazo (US-09.01, US-09.02, US-09.03)
-- Una decisión formal por solicitud (unique en solicitud_id): aprobar o
-- rechazar, con comentario, y — solo si se aprueba — monto_aprobado
-- (ayudas de tipo 'reembolso') o cantidad_aprobada (ayudas físicas). No es
-- editable: es un hecho histórico, igual que evaluaciones_sociales.
--
-- "el rechazo exige motivo" (US-09.02) se refuerza con un CHECK, no solo con
-- validación de la Server Action.
create type public.tipo_decision_solicitud as enum (
  'aprobada',
  'rechazada'
);

create table public.decisiones_solicitud (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null unique references public.solicitudes (id) on delete cascade,
  decision public.tipo_decision_solicitud not null,
  comentario text,
  monto_aprobado numeric(12, 2) check (monto_aprobado is null or monto_aprobado >= 0),
  cantidad_aprobada text,
  aprobador_id uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  constraint comentario_obligatorio_si_rechazada check (
    decision = 'aprobada' or (comentario is not null and length(trim(comentario)) > 0)
  )
);

create index decisiones_solicitud_solicitud_id_idx on public.decisiones_solicitud (solicitud_id);
