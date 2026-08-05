-- US-18.02 — Restringir acceso a documentos sensibles.
--
-- Hasta ahora (20260729000010_rls_documentos.sql) cualquier rol válido podía
-- ver cualquier documento — deliberado en su momento ("EPIC 10 no exige por
-- sí solo restricción por rol específico... la restricción fina por
-- sensibilidad de documento es EPIC 18/US-18.02"). Esta migración cierra esa
-- brecha, ya anotada explícitamente en esa migración y en el comentario de
-- alcance de US-12.06 (EPIC 12).
--
-- Clasificación por tipo_documento (no se agrega una columna "sensible"
-- nueva y redundante — el propio tipo_documento, ya obligatorio desde EPIC
-- 10/US-10.04, es la clasificación):
--   · Médicos: certificado_medico, certificado_dialisis.
--   · Social:  informe_social — mismo dato sensible que hitos/evaluaciones
--     sociales (CLAUDE.md: "Hitos e informes sociales son datos sensibles:
--     requieren RLS restringido a evaluador social/aprobador/administrador.
--     Terreno, bodega y compras nunca acceden a ellos"), aplicado aquí igual
--     que en rls_hitos.sql.
--   · Resto (rsh, boleta, comprobante, fotografia, otro): sin cambios,
--     visibles para cualquier rol válido — ninguna historia pide
--     restringirlos y no son datos médicos ni sociales.
--
-- Matriz resultante (criterios de aceptación de US-18.02):
--   · administrador/evaluador_social/aprobador: ven todo ("documentos de
--     evaluación" — necesitan el contexto completo del hogar/solicitud).
--   · finanzas: médicos SÍ (certificado_medico/certificado_dialisis, para
--     validar reembolsos, US-14.02) + el resto no-sensible; informe_social
--     NO ("documentos necesarios para reembolsos", no de evaluación social).
--   · bodega_logistica/terreno_repartidor ("repartidores no ven documentos
--     médicos" / "bodega no ve certificados médicos salvo autorización" — la
--     autorización la cubre administrador, ya con acceso total, sin
--     necesidad de un mecanismo de excepción nuevo): resto no-sensible.
--   · auditor_consulta ("ve documentos solo si su rol lo permite"): mismo
--     criterio que hitos — resto no-sensible, nunca médicos ni informe_social.
create or replace function public.puede_ver_documento(p_tipo public.tipo_documento)
returns boolean
language sql
stable
set search_path = public
as $$
  select case
    when public.current_role() in ('administrador', 'evaluador_social', 'aprobador') then true
    when public.current_role() = 'finanzas' then
      p_tipo in ('boleta', 'comprobante', 'certificado_medico', 'certificado_dialisis')
    when public.current_role() is not null then
      p_tipo not in ('certificado_medico', 'certificado_dialisis', 'informe_social')
    else false
  end;
$$;

grant execute on function public.puede_ver_documento(public.tipo_documento) to authenticated;

drop policy if exists "documentos_select_rol_valido" on public.documentos;

create policy "documentos_select_segun_sensibilidad"
on public.documentos
for select
to authenticated
using (public.puede_ver_documento(tipo_documento));

-- storage.objects: mismo criterio, resuelto por join contra documentos (el
-- objeto de storage no tiene su propio tipo_documento). Reemplaza la política
-- amplia de la migración de EPIC 10.
drop policy if exists "documentos_storage_select_rol_valido" on storage.objects;

create policy "documentos_storage_select_segun_sensibilidad"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documentos'
  and exists (
    select 1
    from public.documentos d
    where d.storage_path = storage.objects.name
      and public.puede_ver_documento(d.tipo_documento)
  )
);
