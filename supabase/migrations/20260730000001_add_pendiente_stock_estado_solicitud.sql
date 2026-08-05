-- US-11.03 (criterio adicional v2): "la solicitud queda en estado 'pendiente
-- de stock' si no hay disponibilidad" al intentar registrar la salida. El
-- enum estado_solicitud (EPIC 07) no incluía este valor porque EPIC 11 no
-- existía todavía cuando se definieron los 11 estados base.
--
-- En su propia migración (transacción propia, ya comprometida antes de que
-- cualquier otra migración/función la use): Postgres no permite usar un
-- valor de enum recién agregado dentro de la misma transacción en que se
-- agregó.
alter type public.estado_solicitud add value 'pendiente_stock' after 'aprobada_excepcion';
