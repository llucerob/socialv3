-- US-03.03 / US-05.01 — auditar también la fecha de actualización RSH.
--
-- La fecha de actualización RSH es la que decide si el tramo está vigente
-- o "pendiente de actualización" (US-05.03, `evaluarEstadoRsh` en
-- lib/hogares/rsh.ts). Si se puede cambiar sin rastro, se puede hacer pasar
-- un RSH vencido por vigente, así que cuenta como cambio crítico igual que
-- tramo_rsh. Hasta ahora el trigger solo registraba tramo, estado y
-- coordenadas.
--
-- Se redefine la función completa (mismo cuerpo que
-- 20260729000006_add_coordenadas_grupos_familiares.sql + el bloque nuevo);
-- el trigger existente ya apunta a ella, no hay que recrearlo.

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

  if new.fecha_actualizacion_rsh is distinct from old.fecha_actualizacion_rsh then
    insert into public.grupos_familiares_historial
      (grupo_familiar_id, campo, valor_anterior, valor_nuevo, usuario_id)
    values
      (new.id, 'fecha_actualizacion_rsh', old.fecha_actualizacion_rsh::text, new.fecha_actualizacion_rsh::text, auth.uid());
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
