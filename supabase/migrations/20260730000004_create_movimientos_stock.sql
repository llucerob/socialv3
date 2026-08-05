-- EPIC 11 — Movimientos de stock (US-11.02: entradas · US-11.03: salidas
-- por entrega). Tabla única para ambos tipos, discriminada por `tipo`
-- (mismo patrón que documentos: una tabla en vez de dos casi idénticas).
create type public.tipo_movimiento_stock as enum ('entrada', 'salida');

create table public.movimientos_stock (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos (id),
  tipo public.tipo_movimiento_stock not null,
  cantidad integer not null check (cantidad > 0),
  -- Solo una salida se asocia a una solicitud (US-11.03: "la salida se
  -- asocia a una solicitud aprobada"); una entrada no tiene solicitud de
  -- origen (llega de compras/donaciones, EPIC 24 fuera de alcance aquí).
  solicitud_id uuid references public.solicitudes (id),
  observacion text,
  registrado_por uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  constraint movimientos_stock_salida_requiere_solicitud check (
    (tipo = 'entrada' and solicitud_id is null)
    or (tipo = 'salida' and solicitud_id is not null)
  )
);

create index movimientos_stock_producto_id_idx on public.movimientos_stock (producto_id);
create index movimientos_stock_solicitud_id_idx on public.movimientos_stock (solicitud_id);

-- Efecto automático sobre el stock (US-11.02: "el stock aumenta
-- automáticamente" · US-11.03: "el stock disminuye automáticamente", "no se
-- permite stock negativo"). security definer: quien registra el movimiento
-- (bodega) no tiene grant de UPDATE sobre productos.stock_actual (ver RLS de
-- productos) — este trigger es el único camino que sí puede tocar esa
-- columna. La salida usa `where stock_actual >= new.cantidad` en el mismo
-- UPDATE que hace el descuento, de forma que verificar disponibilidad y
-- descontar sea una sola operación atómica (evita condición de carrera
-- entre dos salidas concurrentes del mismo producto).
create or replace function public.aplicar_movimiento_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_filas_actualizadas integer;
begin
  if new.tipo = 'entrada' then
    update public.productos
    set stock_actual = stock_actual + new.cantidad
    where id = new.producto_id;
  else
    update public.productos
    set stock_actual = stock_actual - new.cantidad
    where id = new.producto_id
      and stock_actual >= new.cantidad;

    get diagnostics v_filas_actualizadas = row_count;

    if v_filas_actualizadas = 0 then
      -- Mensaje fijo, reconocido por lib/inventario/actions.ts para decidir
      -- marcar la solicitud como 'pendiente_stock' en vez de mostrar un
      -- error genérico. Al abortar la excepción, el insert en
      -- movimientos_stock tampoco queda registrado (correcto: no hubo
      -- salida real).
      raise exception 'STOCK_INSUFICIENTE' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_aplicar_movimiento_stock
after insert on public.movimientos_stock
for each row
execute function public.aplicar_movimiento_stock();
