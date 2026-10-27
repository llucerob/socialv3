-- US-26.03: "se puede cambiar el estado a 'cerrado' solo si existen medidas
-- correctivas registradas". Hasta ahora la regla vivía solo en la acción de
-- servidor (cerrarIncidente); un administrador que escribiera directo por
-- la API REST podía cerrar un incidente sin medidas. Se refuerza en la
-- base, igual que otras reglas críticas del proyecto (motivo de rechazo,
-- coordenadas, stock no negativo).
alter table public.incidentes_seguridad
  add constraint incidentes_seguridad_cierre_con_medidas_check
  check (estado <> 'cerrado' or nullif(trim(medidas_correctivas), '') is not null);
