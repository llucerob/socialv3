-- Limpia datos parciales de intentos de migración anteriores.
-- Seguro de re-ejecutar. Ejecutar ANTES de 01_migracion_datos.sql.
truncate table hitos, entregas, decisiones_solicitud cascade;
delete from solicitudes where origen = 'migracion';
truncate table personas cascade;
truncate table grupos_familiares cascade;
drop table if exists _map_hogar;
drop table if exists _map_persona;
drop table if exists map_hogar;
drop table if exists map_persona;
drop table if exists map_solic;
