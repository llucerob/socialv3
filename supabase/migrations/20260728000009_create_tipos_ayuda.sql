-- EPIC 06 — Catálogo de tipos de ayuda (US-06.01)
-- Campos según US-06.01: nombre, descripción, tipo, estado. `tipo` no tiene
-- una lista cerrada en el backlog (a diferencia de rol_usuario/estado_persona,
-- que sí la tienen) — queda como texto libre para no imponer una taxonomía
-- no especificada; se seedea con 'material' / 'reembolso' como agrupación
-- razonable de los 5 tipos iniciales.

create type public.estado_tipo_ayuda as enum (
  'activo',
  'inactivo'
);

create table public.tipos_ayuda (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  tipo text not null,
  estado public.estado_tipo_ayuda not null default 'activo',
  -- nullable (a diferencia de grupos_familiares/personas): el catálogo
  -- inicial se siembra vía migración, sin un usuario autenticado real.
  creado_por uuid default auth.uid() references auth.users (id),
  actualizado_por uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_tipos_ayuda_updated_at
before update on public.tipos_ayuda
for each row
execute function public.set_updated_at();

create or replace function public.set_tipo_ayuda_actualizado_por()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_por = auth.uid();
  return new;
end;
$$;

create trigger set_tipos_ayuda_actualizado_por
before update on public.tipos_ayuda
for each row
execute function public.set_tipo_ayuda_actualizado_por();

-- Tipos iniciales (US-06.01). Los campos de reglas (US-06.02) se agregan en
-- la migración siguiente y quedan con sus defaults hasta esa migración.
insert into public.tipos_ayuda (nombre, descripcion, tipo, creado_por) values
  ('Caja de mercadería', 'Ayuda alimentaria básica para el grupo familiar.', 'material', null),
  ('Pañales de adulto', 'Insumo de higiene asociado a un integrante específico del hogar.', 'material', null),
  ('Materiales de construcción', 'Materiales para reparación o mejora de la vivienda.', 'material', null),
  ('Reembolso médico general', 'Reembolso de gastos médicos no asociados a diálisis.', 'reembolso', null),
  ('Reembolso médico por diálisis', 'Reembolso de gastos de diálisis, con tope mensual independiente del esquema general.', 'reembolso', null);
