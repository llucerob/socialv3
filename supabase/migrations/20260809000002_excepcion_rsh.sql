-- US-05.05 — Registrar excepción a la regla del 40% RSH.
-- Bloqueada desde US-05.04 en espera de 🆕 EPIC 23 ("la excepción no puede
-- aprobarse sin un informe social asociado" — ese informe no existía como
-- entidad hasta la migración anterior). Con informes_sociales ya creada,
-- esta migración agrega lo que falta para poder completar US-05.05.
--
-- "Autoridad o unidad que la solicita (ej. alcaldía)" (campo mínimo de
-- US-05.05) no tiene dónde vivir en decisiones_solicitud todavía — se agrega
-- como columna nullable (solo la usa el flujo de excepción RSH; el resto de
-- decisiones la deja en null), mismo criterio que monto_aprobado/
-- cantidad_aprobada (columnas específicas de un tipo de decisión, no de todas).
alter table public.decisiones_solicitud
  add column autoridad_solicitante text;

-- Nota (encontrada al aplicar esta migración desde cero, no al escribirla):
-- el "bug" que este bloque intentaba corregir aquí ("aprobador no puede
-- actualizar solicitudes.estado por RLS") ya había sido corregido antes, en
-- 20260729000002_rls_evaluaciones_sociales.sql — esa migración ya reemplazó
-- la política original ("solicitudes_update_evaluador_o_admin") por
-- "solicitudes_update_gestion_o_aprobacion", con exactamente los mismos 3
-- roles (administrador, evaluador_social, aprobador) que este bloque volvía
-- a crear bajo otro nombre. El drop de abajo apuntaba a una política que ya
-- no existía (fallaba con "does not exist" en una base nueva) y el create
-- habría dejado dos políticas de UPDATE redundantes sobre la misma tabla.
-- Se elimina el bloque completo: no hace falta ninguna acción, la política
-- vigente ya cubre a aprobador.
