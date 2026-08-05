-- EPIC 11 — Ayudas físicas e inventario (US-11.01: crear productos de inventario).
-- `categoria` es texto libre, mismo criterio que tipos_ayuda.tipo (ver esa
-- migración): el maestro no define un mantenedor de categorías de producto
-- (sección 30), así que no se impone una taxonomía cerrada no especificada
-- en el backlog.
create table public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  categoria text not null,
  unidad_medida text not null,
  -- Deriva únicamente de movimientos_stock (ver esa migración): nunca se
  -- edita directamente vía formulario, por eso no forma parte de
  -- crear/editar producto. La RLS restringe también el grant de UPDATE a
  -- nivel de columna para que esto sea una garantía real, no solo una
  -- convención de la aplicación.
  stock_actual integer not null default 0 check (stock_actual >= 0),
  stock_minimo integer not null default 0 check (stock_minimo >= 0),
  -- Nullable: igual que tipos_ayuda, el catálogo inicial se siembra vía
  -- migración sin un usuario autenticado real.
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_productos_updated_at
before update on public.productos
for each row
execute function public.set_updated_at();

-- Productos iniciales (US-11.01; maestro secciones 12 y 13). Los materiales
-- de construcción se modelan como productos inventariables individuales
-- (nylon, ripio, planchas OSB, tapas) — no como una única línea "materiales
-- de construcción" (esa sí existe, pero como tipo_ayuda, una entidad
-- distinta al producto de inventario).
insert into public.productos (nombre, categoria, unidad_medida, stock_minimo) values
  ('Caja de mercadería', 'mercaderia', 'caja', 10),
  ('Pañales talla M', 'panales', 'paquete', 10),
  ('Pañales talla L', 'panales', 'paquete', 10),
  ('Pañales talla XL', 'panales', 'paquete', 10),
  ('Nylon', 'materiales_construccion', 'rollo', 5),
  ('Ripio', 'materiales_construccion', 'm3', 5),
  ('Planchas OSB', 'materiales_construccion', 'unidad', 10),
  ('Tapas', 'materiales_construccion', 'unidad', 10);
