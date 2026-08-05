-- 🆕 EPIC 26 — Gestión de incidentes de seguridad (US-26.01 a US-26.04).
-- Cubre la sección 47 del Contexto Maestro, relevante de cara a la Ley
-- 21.719 (vigente desde el 1 de diciembre de 2026).
--
-- No hay un rol "encargado de seguridad de la información" en RolUsuario
-- (lib/auth/types.ts) — toda escritura queda en administrador (único rol
-- nombrado en US-26.01/26.03/26.04); la lectura se amplía a auditor_consulta
-- solo para el listado/detalle (US-26.02: "acceso restringido a
-- administrador/auditor").
--
-- Mismo esqueleto que proveedores (20260810000001_proveedores.sql): tabla
-- propia + trigger updated_at + tabla _historial con trigger genérico de
-- auditoría por campo (US-26.03: "el cierre queda
-- auditado"). No hay historia de "editar incidente": los campos de
-- creación (usuario involucrado, tipo, datos afectados, cantidad de
-- afectados, responsable de seguimiento) quedan inmutables después de
-- creados — solo estado/medidas_correctivas (al cerrar) y los 3 campos de
-- notificación (al notificar) son editables, y son justamente los que
-- audita el trigger de historial.
create type public.tipo_incidente_seguridad as enum (
  'acceso_no_autorizado',
  'perdida_documento',
  'filtracion',
  'uso_indebido_credenciales',
  'otro'
);

create type public.estado_incidente_seguridad as enum ('abierto', 'cerrado');

-- US-26.04: "destinatario (Agencia / titulares / ambos)".
create type public.destinatario_notificacion_incidente as enum ('agencia', 'titulares', 'ambos');

create table public.incidentes_seguridad (
  id uuid primary key default gen_random_uuid(),
  fecha_incidente date not null,
  -- Nullable: no todo incidente involucra a un usuario identificable del
  -- sistema (ej. pérdida de un documento físico).
  usuario_involucrado_id uuid references auth.users (id),
  tipo public.tipo_incidente_seguridad not null,
  datos_afectados text not null,
  cantidad_personas_afectadas integer not null check (cantidad_personas_afectadas >= 0),
  -- Nullable: puede completarse al crear el incidente o exigirse recién al
  -- cerrarlo (US-26.03, ver lib/incidentes/actions.ts::cerrarIncidente).
  medidas_correctivas text,
  responsable_seguimiento_id uuid not null references auth.users (id),
  estado public.estado_incidente_seguridad not null default 'abierto',
  -- US-26.04: registro manual de notificación, sin automatizar el envío.
  notificacion_fecha date,
  notificacion_destinatario public.destinatario_notificacion_incidente,
  notificacion_responsable_id uuid references auth.users (id),
  creado_por uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index incidentes_seguridad_estado_idx on public.incidentes_seguridad (estado);
create index incidentes_seguridad_tipo_idx on public.incidentes_seguridad (tipo);

create trigger set_incidentes_seguridad_updated_at
before update on public.incidentes_seguridad
for each row
execute function public.set_updated_at();

-- US-26.01: "el registro queda auditado" — la propia fila (creado_por/
-- created_at) ya lo cubre, igual criterio que decisiones_solicitud. No se
-- agrega columna actualizado_por: a diferencia de proveedores, aquí toda
-- actualización posterior (cerrar, notificar) ya queda mejor identificada
-- por el trigger de historial de abajo, que registra el usuario de cada
-- cambio puntual en vez de un único "última persona que tocó la fila".
create table public.incidentes_seguridad_historial (
  id uuid primary key default gen_random_uuid(),
  incidente_id uuid not null references public.incidentes_seguridad (id) on delete cascade,
  campo text not null,
  valor_anterior text,
  valor_nuevo text,
  usuario_id uuid references auth.users (id),
  creado_en timestamptz not null default now()
);

create or replace function public.log_incidente_seguridad_cambio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  campo text;
begin
  foreach campo in array array[
    'estado', 'medidas_correctivas',
    'notificacion_fecha', 'notificacion_destinatario', 'notificacion_responsable_id'
  ]
  loop
    if to_jsonb(new) ->> campo is distinct from to_jsonb(old) ->> campo then
      insert into public.incidentes_seguridad_historial (incidente_id, campo, valor_anterior, valor_nuevo, usuario_id)
      values (new.id, campo, to_jsonb(old) ->> campo, to_jsonb(new) ->> campo, auth.uid());
    end if;
  end loop;

  return new;
end;
$$;

create trigger incidentes_seguridad_audit_cambios
after update on public.incidentes_seguridad
for each row
execute function public.log_incidente_seguridad_cambio();

alter table public.incidentes_seguridad enable row level security;

create policy "incidentes_seguridad_select_admin_o_auditor"
on public.incidentes_seguridad
for select
to authenticated
using (public.current_role() in ('administrador', 'auditor_consulta'));

create policy "incidentes_seguridad_insert_admin"
on public.incidentes_seguridad
for insert
to authenticated
with check (public.current_role() = 'administrador');

create policy "incidentes_seguridad_update_admin"
on public.incidentes_seguridad
for update
to authenticated
using (public.current_role() = 'administrador')
with check (public.current_role() = 'administrador');

grant select, insert, update on public.incidentes_seguridad to authenticated;

alter table public.incidentes_seguridad_historial enable row level security;

create policy "incidentes_seguridad_historial_select_admin_o_auditor"
on public.incidentes_seguridad_historial
for select
to authenticated
using (public.current_role() in ('administrador', 'auditor_consulta'));

grant select on public.incidentes_seguridad_historial to authenticated;
