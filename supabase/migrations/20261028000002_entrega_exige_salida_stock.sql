-- MR-07 — Una entrega exige la salida de stock registrada.
--
-- Hasta ahora la salida de stock (US-11.03, bodega) y la entrega (EPIC 12,
-- MR-06) eran pasos independientes: una caja se podía entregar sin
-- descontarla del inventario. La regla queda en la base para que aplique a
-- la pantalla, a la sincronización offline de terreno y a cualquier acceso
-- directo:
--   * crear una entrega (programar a domicilio o registrar en local), y
--   * pasar una entrega a 'realizada' (cubre las entregas a domicilio que ya
--     estaban programadas antes de esta regla)
-- exigen al menos una salida de stock asociada a la solicitud. Marcar una
-- entrega como fallida no la exige.

-- Consulta para quien no lee movimientos_stock (RLS: solo bodega y
-- administrador): gestor social, aprobador y terreno necesitan saber si la
-- salida está hecha para mostrar el próximo paso. Devuelve solo los ids de
-- solicitud con salida, nunca productos ni cantidades.
create or replace function public.solicitudes_con_salida_stock(p_solicitud_ids uuid[])
returns setof uuid
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.tiene_algun_rol() then
    raise exception 'No autorizado';
  end if;

  return query
  select distinct m.solicitud_id
  from public.movimientos_stock m
  where m.tipo = 'salida'
    and m.solicitud_id = any (p_solicitud_ids);
end;
$$;

grant execute on function public.solicitudes_con_salida_stock(uuid[]) to authenticated;

create or replace function public.exigir_salida_stock_entrega()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT' or (new.estado = 'realizada' and old.estado is distinct from 'realizada'))
     and not exists (
       select 1 from public.movimientos_stock m
       where m.tipo = 'salida' and m.solicitud_id = new.solicitud_id
     ) then
    raise exception 'SIN_SALIDA_STOCK';
  end if;

  return new;
end;
$$;

create trigger entregas_exigir_salida_stock
before insert or update on public.entregas
for each row
execute function public.exigir_salida_stock_entrega();
