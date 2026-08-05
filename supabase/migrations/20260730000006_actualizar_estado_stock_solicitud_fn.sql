-- US-11.03: la solicitud queda en 'pendiente_stock' cuando no hay stock
-- suficiente para la salida, y debe poder volver a 'aprobada' cuando bodega
-- reintenta con éxito tras un nuevo ingreso de stock. La RLS de solicitudes
-- (EPIC 07) solo permite UPDATE a administrador/evaluador_social — bodega no
-- gestiona solicitudes en general — así que esta transición puntual y
-- acotada necesita su propia función, mismo patrón que
-- registrar_validacion_rsh_solicitud (ver create_solicitudes.sql).
--
-- IMPORTANTE: al ser security definer, esta función se ejecuta con
-- privilegios elevados sin pasar por RLS. El chequeo de rol de abajo NO es
-- opcional: sin él, cualquier usuario autenticado podría llamar esta función
-- por REST directamente y cambiar el estado de cualquier solicitud.
create or replace function public.actualizar_estado_stock_solicitud(
  p_solicitud_id uuid,
  p_nuevo_estado public.estado_solicitud
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_role() not in ('administrador', 'bodega_logistica') then
    raise exception 'No autorizado';
  end if;

  -- Única transición que esta función autoriza: entre 'aprobada'/
  -- 'aprobada_excepcion' y 'pendiente_stock', en cualquier dirección. No es
  -- un mecanismo genérico de cambio de estado de solicitudes.
  if p_nuevo_estado not in ('pendiente_stock', 'aprobada') then
    raise exception 'Transición de estado no permitida desde inventario';
  end if;

  update public.solicitudes
  set estado = p_nuevo_estado
  where id = p_solicitud_id
    and estado in ('aprobada', 'aprobada_excepcion', 'pendiente_stock');
end;
$$;

grant execute on function public.actualizar_estado_stock_solicitud(uuid, public.estado_solicitud) to authenticated;
