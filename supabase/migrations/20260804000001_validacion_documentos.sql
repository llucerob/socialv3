-- US-14.02: "validar documentos de reembolso" — se puede marcar documento
-- como válido u observado, con comentario opcional. Se agrega al mismo
-- `documentos` de EPIC 10 en vez de crear una tabla nueva: la validación es
-- un atributo más del documento, no una entidad propia, y así se reutiliza
-- toda la infraestructura ya existente (RLS de lectura, storage privado,
-- listado por solicitud/hogar).
create type public.estado_validacion_documento as enum ('pendiente', 'valido', 'observado');

alter table public.documentos
  add column estado_validacion public.estado_validacion_documento not null default 'pendiente',
  add column comentario_validacion text,
  add column validado_por uuid references auth.users (id),
  add column validado_en timestamptz;

-- "La validación queda registrada": se guarda automáticamente quién y
-- cuándo, igual criterio que actualizado_por en grupos_familiares/personas —
-- no se confía en que el cliente envíe estos dos campos.
create or replace function public.set_documento_validado_por()
returns trigger
language plpgsql
as $$
begin
  if new.estado_validacion is distinct from old.estado_validacion then
    new.validado_por = auth.uid();
    new.validado_en = now();
  end if;
  return new;
end;
$$;

create trigger set_documentos_validado_por
before update on public.documentos
for each row
execute function public.set_documento_validado_por();
