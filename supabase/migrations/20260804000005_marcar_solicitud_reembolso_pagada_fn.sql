-- US-14.04: "la solicitud pasa a pagada o cerrada" al registrar el pago. El
-- estado disponible más cercano en estado_solicitud (EPIC 07) es
-- 'entregada_pagada' — mismo valor que ya usa marcar_solicitud_entregada
-- (EPIC 12) para ayudas físicas; aquí lo consume el flujo de reembolsos.
--
-- La RLS de solicitudes (EPIC 07) solo permite UPDATE a administrador/
-- evaluador_social — finanzas (quien registra el pago) no gestiona
-- solicitudes en general — así que, igual que marcar_solicitud_entregada y
-- actualizar_estado_stock_solicitud, esta transición puntual y acotada
-- necesita su propia función security definer.
--
-- IMPORTANTE: el chequeo de rol de abajo NO es opcional: sin él, cualquier
-- usuario autenticado podría llamar esta función por REST directamente y
-- marcar cualquier solicitud como pagada.
create or replace function public.marcar_solicitud_reembolso_pagada(p_solicitud_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_role() not in ('administrador', 'finanzas') then
    raise exception 'No autorizado';
  end if;

  update public.solicitudes
  set estado = 'entregada_pagada'
  where id = p_solicitud_id
    and estado in ('aprobada', 'aprobada_excepcion');
end;
$$;

grant execute on function public.marcar_solicitud_reembolso_pagada(uuid) to authenticated;
