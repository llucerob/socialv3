-- US-05.02 — "Adjuntar respaldo RSH": criterio "visible solo para roles
-- autorizados". La subida ("subida de documento RSH", "asociado al hogar")
-- y el almacenamiento privado ya funcionan gratis vía la infraestructura
-- genérica de EPIC 10 (tipo_documento ya incluye 'rsh' desde su creación) —
-- lo único que faltaba era la restricción de visibilidad.
--
-- La migración de EPIC 18 (20260807000001_rls_documentos_sensibilidad.sql)
-- dejó 'rsh' en la categoría "resto" (visible a cualquier rol válido,
-- incluyendo bodega_logistica y terreno_repartidor), razonando "ninguna
-- historia pide restringirlos" — pero esa revisión no cruzó contra US-05.02
-- (EPIC 05), que sí lo pide explícitamente. Se corrige clasificando 'rsh'
-- igual que 'informe_social': un respaldo de Registro Social de Hogares
-- contiene composición y situación socioeconómica del hogar — el mismo
-- tipo de dato sensible usado para elegibilidad, no un comprobante de
-- gasto ni un certificado médico — así que se restringe al mismo público
-- (administrador/evaluador_social/aprobador), sin incluir a finanzas (no
-- es un respaldo de reembolso) ni a bodega/terreno/auditor_consulta.
create or replace function public.puede_ver_documento(p_tipo public.tipo_documento)
returns boolean
language sql
stable
set search_path = public
as $$
  select case
    when public.current_role() in ('administrador', 'evaluador_social', 'aprobador') then true
    when public.current_role() = 'finanzas' then
      p_tipo in ('boleta', 'comprobante', 'certificado_medico', 'certificado_dialisis', 'certificado_defuncion')
    when public.current_role() is not null then
      p_tipo not in ('certificado_medico', 'certificado_dialisis', 'certificado_defuncion', 'informe_social', 'rsh')
    else false
  end;
$$;
