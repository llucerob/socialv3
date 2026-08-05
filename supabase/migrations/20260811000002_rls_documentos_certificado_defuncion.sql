-- 🆕 EPIC 25 — clasifica 'certificado_defuncion' (agregado en la migración
-- anterior) con el mismo criterio que los demás certificados médicos en
-- puede_ver_documento() (20260807000001_rls_documentos_sensibilidad.sql):
-- administrador/evaluador_social/aprobador ven todo · finanzas lo ve
-- (necesita validar el reembolso, igual que certificado_medico/
-- certificado_dialisis, US-14.02/US-25.01) · el resto de roles no lo ve
-- (documento sensible, análogo a un certificado médico).
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
      p_tipo not in ('certificado_medico', 'certificado_dialisis', 'certificado_defuncion', 'informe_social')
    else false
  end;
$$;
