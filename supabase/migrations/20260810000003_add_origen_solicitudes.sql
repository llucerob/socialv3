-- ============================================================
-- MIGRACIÓN DE ESQUEMA (aplicar ANTES de migrar datos)
-- Archivo: supabase/migrations/20260810000001_add_origen_solicitudes.sql
-- Agrega la columna `origen` a solicitudes para distinguir registros
-- migrados del sistema anterior de los creados operativamente. Permite que
-- el dashboard (EPIC 02) y los reportes excluyan datos históricos de los KPIs.
-- ============================================================
alter table public.solicitudes
  add column if not exists origen text not null default 'sistema'
  check (origen in ('sistema','migracion'));

create index if not exists solicitudes_origen_idx on public.solicitudes (origen);

comment on column public.solicitudes.origen is
  'sistema = creada en operación normal; migracion = importada del sistema legacy fondosco_social.';
