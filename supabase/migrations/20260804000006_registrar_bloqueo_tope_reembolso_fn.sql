-- US-14.06: "el bloqueo queda auditado" cuando se intenta aprobar un monto
-- fuera de los topes calculados por US-14.05 (tramo agotado o pool anual
-- agotado). Mismo patrón que registrar_validacion_rsh_solicitud (US-05.04):
-- security definer porque el aprobador no tiene grant de insert directo
-- sobre solicitudes_historial.
--
-- IMPORTANTE: el chequeo de rol de abajo NO es opcional: sin él, cualquier
-- usuario autenticado podría inyectar entradas falsas en el historial de
-- auditoría de cualquier solicitud.
create or replace function public.registrar_bloqueo_tope_reembolso(
  p_solicitud_id uuid,
  p_motivo text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_role() not in ('administrador', 'aprobador') then
    raise exception 'No autorizado';
  end if;

  insert into public.solicitudes_historial (solicitud_id, campo, valor_anterior, valor_nuevo, usuario_id)
  values (p_solicitud_id, 'tope_reembolso', null, p_motivo, auth.uid());
end;
$$;

grant execute on function public.registrar_bloqueo_tope_reembolso(uuid, text) to authenticated;
