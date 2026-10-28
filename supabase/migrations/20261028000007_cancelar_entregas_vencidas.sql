-- MR-08 (ajuste, decisión del cliente 2026-10-28) — las entregas de un
-- beneficio cuyo plazo venció se cancelan solas.
--
-- Una entrega programada (pendiente) o fallida de un período que ya no se
-- puede retirar (calendario_beneficio la marca 'no_entregado') o de un
-- beneficio vencido (después del 31 de diciembre) ya no se puede marcar
-- realizada (validar_periodo_beneficio). Seguía apareciendo en "Mis
-- entregas" y en la ruta; ahora pasa a 'cancelada', con el cambio en
-- entregas_historial (usuario vacío: lo hizo el sistema).
--
-- Corre de dos formas, para no depender de una sola:
--   * a diario con pg_cron, si la base lo tiene disponible;
--   * al abrir las listas de entregas (bodega, terreno y el calendario de
--     la solicitud), desde la app. Es idempotente: solo toca lo vencido.

create or replace function public.cancelar_entregas_vencidas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_canceladas integer;
begin
  -- Sin sesión es la tarea programada; con sesión, cualquier usuario activo
  -- (la regla no depende de quién la dispare).
  if auth.uid() is not null and not public.tiene_algun_rol() then
    raise exception 'No autorizado';
  end if;

  update public.entregas e
  set estado = 'cancelada'
  from public.beneficios b
  where b.solicitud_id = e.solicitud_id
    and e.estado in ('pendiente', 'fallida')
    and (
      public.mes_actual_chile() > b.vigente_hasta
      or exists (
        select 1 from public.calendario_beneficio(b.id) c
        where c.periodo = e.periodo and c.estado = 'no_entregado'
      )
    );

  get diagnostics v_canceladas = row_count;
  return v_canceladas;
end;
$$;

revoke all on function public.cancelar_entregas_vencidas() from public, anon;
grant execute on function public.cancelar_entregas_vencidas() to authenticated;

-- Tarea diaria a las 04:10 UTC (00:10 o 01:10 en Chile). Si pg_cron no está
-- disponible la migración sigue: la app la llama igual al abrir las listas.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule(
    'cancelar-entregas-vencidas',
    '10 4 * * *',
    'select public.cancelar_entregas_vencidas()'
  );
exception when others then
  raise notice 'pg_cron no disponible (%): las entregas vencidas se cancelan al abrir las listas.', sqlerrm;
end;
$$;
