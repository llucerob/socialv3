-- MR-08 — Estado 'cancelada' para las entregas de un beneficio suspendido.
--
-- Va en su propia migración: un valor nuevo de enum no se puede usar en la
-- misma transacción en que se agrega, y 20261028000005 lo usa en
-- suspender_beneficio().
alter type public.estado_entrega add value if not exists 'cancelada';
