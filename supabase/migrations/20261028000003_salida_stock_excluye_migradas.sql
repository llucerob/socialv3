-- MR-07 (ajuste) — La regla "una entrega exige salida de stock" no aplica a
-- las entregas migradas del sistema anterior.
--
-- El sistema anterior no llevaba inventario: la carga de datos históricos
-- (antiguos/migracion_oficial/migracion_coinco/01_migracion_datos.sql)
-- inserta unas 12.100 entregas ya realizadas, sin movimientos de stock.
-- Con el trigger de 20261028000002 esa carga fallaba en una base nueva
-- (README de la migración: primero las migraciones, después los datos).
-- Las solicitudes migradas se distinguen por solicitudes.origen = 'migracion'.

create or replace function public.exigir_salida_stock_entrega()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT' or (new.estado = 'realizada' and old.estado is distinct from 'realizada'))
     and not exists (
       select 1 from public.solicitudes s
       where s.id = new.solicitud_id and s.origen = 'migracion'
     )
     and not exists (
       select 1 from public.movimientos_stock m
       where m.tipo = 'salida' and m.solicitud_id = new.solicitud_id
     ) then
    raise exception 'SIN_SALIDA_STOCK';
  end if;

  return new;
end;
$$;
