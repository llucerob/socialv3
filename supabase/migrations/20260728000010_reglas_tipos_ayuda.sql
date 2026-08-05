-- US-06.02 — Reglas por tipo de ayuda. Son columnas de la misma fila de
-- tipos_ayuda (relación 1:1 "reglas propias por ayuda"), no una tabla aparte.
--
-- `tope_monetario`/`tiene_tope_monetario` es un tope genérico simple a nivel
-- de catálogo. NO reemplaza ni duplica el cálculo de remanente anual de
-- reembolsos ($100.000 compartido general/excepcional, $150.000 mensual
-- diálisis) — esa es una regla de negocio con estado acumulado por grupo
-- familiar que vive en US-25.02 (fuente única, ver CLAUDE.md). Por eso los
-- reembolsos se siembran aquí con tiene_tope_monetario = false.
alter table public.tipos_ayuda
  add column requiere_aprobacion boolean not null default true,
  add column requiere_entrega boolean not null default false,
  add column requiere_evidencia boolean not null default false,
  add column requiere_persona_beneficiaria boolean not null default false,
  add column requiere_documentos boolean not null default false,
  add column tiene_tope_monetario boolean not null default false,
  add column tope_monetario numeric(12, 2),
  add column periodicidad text;

update public.tipos_ayuda set
  requiere_entrega = true,
  requiere_evidencia = true,
  requiere_persona_beneficiaria = false
where nombre = 'Caja de mercadería';

update public.tipos_ayuda set
  requiere_entrega = true,
  requiere_evidencia = true,
  requiere_persona_beneficiaria = true,
  requiere_documentos = true
where nombre = 'Pañales de adulto';

update public.tipos_ayuda set
  requiere_entrega = true,
  requiere_evidencia = true,
  requiere_persona_beneficiaria = false
where nombre = 'Materiales de construcción';

update public.tipos_ayuda set
  requiere_entrega = false,
  requiere_evidencia = false,
  requiere_persona_beneficiaria = true,
  requiere_documentos = true,
  periodicidad = 'Hasta 4 veces al año (tope compartido con excepciones, ver US-25.02)'
where nombre = 'Reembolso médico general';

update public.tipos_ayuda set
  requiere_entrega = false,
  requiere_evidencia = false,
  requiere_persona_beneficiaria = true,
  requiere_documentos = true,
  periodicidad = 'Mensual (tope independiente del esquema general, ver EPIC 15)'
where nombre = 'Reembolso médico por diálisis';

-- Historial de cambios (US-06.02: "cambios auditados"; US-06.03: "cambio
-- auditado" al activar/desactivar). Mismo patrón que grupos_familiares/personas.
create table public.tipos_ayuda_historial (
  id uuid primary key default gen_random_uuid(),
  tipo_ayuda_id uuid not null references public.tipos_ayuda (id) on delete cascade,
  campo text not null,
  valor_anterior text,
  valor_nuevo text,
  usuario_id uuid references auth.users (id),
  creado_en timestamptz not null default now()
);

create or replace function public.log_tipo_ayuda_cambio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  campo text;
begin
  foreach campo in array array[
    'nombre', 'descripcion', 'tipo', 'estado',
    'requiere_aprobacion', 'requiere_entrega', 'requiere_evidencia',
    'requiere_persona_beneficiaria', 'requiere_documentos',
    'tiene_tope_monetario', 'tope_monetario', 'periodicidad'
  ]
  loop
    if to_jsonb(new) ->> campo is distinct from to_jsonb(old) ->> campo then
      insert into public.tipos_ayuda_historial (tipo_ayuda_id, campo, valor_anterior, valor_nuevo, usuario_id)
      values (new.id, campo, to_jsonb(old) ->> campo, to_jsonb(new) ->> campo, auth.uid());
    end if;
  end loop;

  return new;
end;
$$;

create trigger tipos_ayuda_audit_cambios
after update on public.tipos_ayuda
for each row
execute function public.log_tipo_ayuda_cambio();
