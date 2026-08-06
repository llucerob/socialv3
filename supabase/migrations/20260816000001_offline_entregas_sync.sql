-- EPIC 27 (US-27.05, US-27.07) — soporte de sincronización offline para
-- entregas. Dos piezas:
--
-- 1) `capturado_en`: momento real en que el funcionario registró el
--    resultado (offline u online), distinto de `updated_at` (cuándo quedó
--    escrito en el servidor) y de `fecha_hora_entrega` (que ya existía pero
--    solo aplica a 'realizada', no a 'fallida'). US-27.05 exige que el
--    sistema use "la fecha y hora original de captura, no la de
--    sincronización" — sin esta columna, una entrega 'fallida' registrada
--    offline y sincronizada más tarde no tendría forma de distinguir ambos
--    momentos. Se puebla desde ahora en ambos flujos (realizada/fallida);
--    filas anteriores a esta migración quedan en null.
--
-- 2) `registrar_conflicto_sync_entrega`: US-27.07 pide que "última escritura
--    por fecha de captura gana" y que "todo conflicto quede registrado en
--    auditoría, indicando qué versión se descartó". El trigger existente
--    (`log_entrega_cambio`, ver 20260731000001_create_entregas.sql) audita
--    automáticamente los UPDATE que cambian estado/responsable_id/
--    fecha_programada/motivo_fallo — pero un conflicto de sync tiene dos
--    casos que ese trigger NO cubre: (a) la escritura entrante se descarta
--    por ser más antigua — no hay UPDATE en absoluto, así que el trigger
--    nunca corre; (b) la escritura entrante gana pero el valor de `estado`
--    es el mismo de antes (ej. dos capturas 'realizada' distintas para la
--    misma entrega) — el trigger no lo detecta porque solo compara esas 4
--    columnas. Por eso hace falta un insert explícito, vía función
--    security definer (mismo patrón que registrar_observacion_solicitud) en
--    vez de una política RLS directa: entregas_historial hoy solo tiene
--    SELECT para bodega/administrador, ningún INSERT para terreno.
alter table public.entregas add column capturado_en timestamptz;

create or replace function public.registrar_conflicto_sync_entrega(
  p_entrega_id uuid,
  p_campo text,
  p_valor_anterior text,
  p_valor_nuevo text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_role() not in ('terreno_repartidor', 'administrador') then
    raise exception 'No autorizado';
  end if;

  insert into public.entregas_historial (entrega_id, campo, valor_anterior, valor_nuevo, usuario_id)
  values (p_entrega_id, p_campo, p_valor_anterior, p_valor_nuevo, auth.uid());
end;
$$;

grant execute on function public.registrar_conflicto_sync_entrega(uuid, text, text, text) to authenticated;
