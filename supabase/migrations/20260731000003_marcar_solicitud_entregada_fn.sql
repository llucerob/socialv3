-- US-12.04: "la solicitud asociada cambia a entregada o cerrada según
-- flujo" al completar la entrega. El estado disponible más cercano en
-- estado_solicitud (EPIC 07) es 'entregada_pagada' (cubre tanto ayudas
-- físicas entregadas como reembolsos pagados; EPIC 14 de reembolsos no
-- existe todavía, así que hoy solo este flujo lo usa).
--
-- La RLS de solicitudes (EPIC 07) solo permite UPDATE a administrador/
-- evaluador_social — terreno_repartidor (quien marca la entrega realizada)
-- no gestiona solicitudes en general — así que, igual que
-- actualizar_estado_stock_solicitud (EPIC 11), esta transición puntual y
-- acotada necesita su propia función security definer.
--
-- IMPORTANTE: el chequeo de rol de abajo NO es opcional: sin él, cualquier
-- usuario autenticado podría llamar esta función por REST directamente y
-- marcar cualquier solicitud como entregada.
create or replace function public.marcar_solicitud_entregada(p_solicitud_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_role() not in ('administrador', 'bodega_logistica', 'terreno_repartidor') then
    raise exception 'No autorizado';
  end if;

  update public.solicitudes
  set estado = 'entregada_pagada'
  where id = p_solicitud_id
    and estado in ('aprobada', 'aprobada_excepcion');
end;
$$;

grant execute on function public.marcar_solicitud_entregada(uuid) to authenticated;
