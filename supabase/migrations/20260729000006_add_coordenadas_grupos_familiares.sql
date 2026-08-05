-- US-03.06 — Registrar coordenadas del domicilio.
-- Opcional (un hogar sin coordenadas sigue operando con normalidad; solo
-- queda excluido del cálculo de ruta de US-13.04, que no se construye
-- todavía). Precisión ~1cm (7 decimales), suficiente para georreferenciar
-- una vivienda.
alter table public.grupos_familiares
  add column latitud numeric(10, 7) check (latitud is null or (latitud >= -90 and latitud <= 90)),
  add column longitud numeric(10, 7) check (longitud is null or (longitud >= -180 and longitud <= 180));

-- "El cambio de coordenadas queda auditado": se agregan al mismo trigger de
-- cambios críticos que ya audita tramo_rsh/estado (US-03.03).
create or replace function public.log_grupo_familiar_cambio_critico()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tramo_rsh is distinct from old.tramo_rsh then
    insert into public.grupos_familiares_historial
      (grupo_familiar_id, campo, valor_anterior, valor_nuevo, usuario_id)
    values
      (new.id, 'tramo_rsh', old.tramo_rsh::text, new.tramo_rsh::text, auth.uid());
  end if;

  if new.estado is distinct from old.estado then
    insert into public.grupos_familiares_historial
      (grupo_familiar_id, campo, valor_anterior, valor_nuevo, usuario_id)
    values
      (new.id, 'estado', old.estado::text, new.estado::text, auth.uid());
  end if;

  if new.latitud is distinct from old.latitud then
    insert into public.grupos_familiares_historial
      (grupo_familiar_id, campo, valor_anterior, valor_nuevo, usuario_id)
    values
      (new.id, 'latitud', old.latitud::text, new.latitud::text, auth.uid());
  end if;

  if new.longitud is distinct from old.longitud then
    insert into public.grupos_familiares_historial
      (grupo_familiar_id, campo, valor_anterior, valor_nuevo, usuario_id)
    values
      (new.id, 'longitud', old.longitud::text, new.longitud::text, auth.uid());
  end if;

  return new;
end;
$$;
