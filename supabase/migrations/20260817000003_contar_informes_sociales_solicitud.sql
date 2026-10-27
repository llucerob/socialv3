-- US-05.05 / US-23.01 / US-25.01 — "no se puede aprobar sin un informe
-- social asociado": el chequeo debe ver TODOS los informes de la solicitud,
-- no solo los que el rol puede leer.
--
-- puede_ver_informe_social() oculta al aprobador los informes de
-- confidencialidad 'alta'. Como el chequeo se hacía leyendo la tabla con
-- RLS, un aprobador con un informe 'alta' ya registrado veía cero informes:
-- la excepción RSH y los reembolsos excepcionales quedaban bloqueados (y el
-- formulario de excepción ni siquiera aparecía) aunque el requisito estaba
-- cumplido.
--
-- Esta función solo devuelve cuántos informes existen, sin exponer su
-- contenido, para los mismos roles que pueden ver la sección de informes
-- de una solicitud. La confidencialidad del contenido no cambia.

create or replace function public.contar_informes_sociales_de_solicitud(p_solicitud_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.current_role() not in ('administrador', 'evaluador_social', 'aprobador') then
    raise exception 'No autorizado';
  end if;

  return (select count(*)::integer from public.informes_sociales where solicitud_id = p_solicitud_id);
end;
$$;

grant execute on function public.contar_informes_sociales_de_solicitud(uuid) to authenticated;
