-- 🆕 EPIC 25 (US-25.01/US-25.04) — catálogo de los 2 reembolsos
-- excepcionales. Mismo criterio de identificación por nombre exacto que
-- 'Reembolso médico general'/'Reembolso médico por diálisis' (ver
-- lib/reembolsos/tramos.ts) — no hay columna que distinga el subtipo de
-- reembolso. A diferencia de la migración original de EPIC 06
-- (20260728000009/...010), las columnas de reglas (US-06.02) ya existen, así
-- que se siembran directamente en el insert, sin paso INSERT+UPDATE.
--
-- tiene_tope_monetario = false a propósito (igual que general/diálisis): el
-- tope real es el remanente anual compartido de $100.000 por grupo familiar
-- (US-25.02, lib/reembolsos/dal.ts::calcularRemanenteReembolsoAnual), que no
-- es un tope de catálogo simple sino estado acumulado por hogar.
insert into public.tipos_ayuda (
  nombre, descripcion, tipo,
  requiere_entrega, requiere_evidencia, requiere_persona_beneficiaria, requiere_documentos,
  tiene_tope_monetario, periodicidad
) values
  (
    'Reembolso excepcional por cirugía',
    'Reembolso excepcional para apoyar al hogar ante una intervención quirúrgica de un integrante.',
    'reembolso',
    false, false, true, true,
    false,
    'Sin tramos fijos; limitado por el remanente anual compartido del hogar (ver US-25.02)'
  ),
  (
    'Reembolso excepcional por fallecimiento o servicio funerario',
    'Reembolso excepcional para apoyar gastos de servicio funerario ante el fallecimiento de un integrante del hogar.',
    'reembolso',
    false, false, true, true,
    false,
    'Sin tramos fijos; limitado por el remanente anual compartido del hogar (ver US-25.02)'
  );
