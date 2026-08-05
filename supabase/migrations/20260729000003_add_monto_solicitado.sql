-- EPIC 09 (US-09.03) — "el monto aprobado no puede superar el monto
-- solicitado" exige que la solicitud ya cargue un monto solicitado. Esto no
-- se contempló en los "campos mínimos" de US-07.01 (que no menciona monto),
-- así que se agrega ahora, retroactivo a EPIC 07 — solo es relevante para
-- ayudas de tipo 'reembolso' (tipos_ayuda.tipo); para ayudas físicas queda
-- en null.
alter table public.solicitudes
  add column monto_solicitado numeric(12, 2) check (monto_solicitado is null or monto_solicitado >= 0);
