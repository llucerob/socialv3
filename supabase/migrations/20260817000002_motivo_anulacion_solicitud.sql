-- US-07.06 — motivo obligatorio al anular una solicitud.
--
-- Anular es irreversible (no hay transición de salida desde 'anulada') y
-- hasta ahora se hacía con un solo clic, sin dejar constancia de por qué.
-- Mismo patrón que registrar_observacion_solicitud (US-08.03): el motivo
-- queda en solicitudes_historial, que no tiene grant de insert directo,
-- vía una función security definer con el mismo chequeo de rol que la
-- acción de servidor (administrador / evaluador_social).

create or replace function public.registrar_anulacion_solicitud(
  p_solicitud_id uuid,
  p_motivo text
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
  values (p_solicitud_id, 'motivo_anulacion', null, p_motivo, auth.uid());
end;
$$;

grant execute on function public.registrar_anulacion_solicitud(uuid, text) to authenticated;
