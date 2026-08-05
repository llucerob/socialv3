-- EPIC 02 (US-02.01) — cablear las tarjetas "Solicitudes pendientes de
-- aprobación" y "Reembolsos pendientes" del dashboard (lib/dashboard/sections.ts)
-- con datos reales. Ambas tarjetas incluyen a auditor_consulta
-- (DASHBOARD_SECTIONS_BY_ROL, ya asignado desde EPIC 02 original), que no
-- tiene SELECT sobre evaluaciones_sociales (dato sensible, EPIC 08) ni sobre
-- decisiones_solicitud/pagos_reembolso (EPIC 09/14) — mismo criterio que
-- EPIC 12 (20260813000001_lectura_entregas_otros_roles.sql): función
-- security definer con chequeo de rol interno, en vez de ensanchar la RLS
-- de esas tablas a un rol de solo consulta.
--
-- "Solicitudes en evaluación" (evaluador_social/administrador, sin
-- auditor_consulta) no necesita función nueva: ambos roles ya tienen SELECT
-- directo sobre evaluaciones_sociales, se resuelve en la capa de aplicación
-- (lib/solicitudes/dal.ts).

-- "Solicitudes pendientes de aprobación" = en evaluación Y con al menos una
-- evaluación social ya registrada (lista para decisión) — el complemento de
-- "en evaluación sin evaluar" que sí se resuelve sin RPC.
create or replace function public.listar_solicitudes_pendientes_aprobacion_dashboard()
returns table (
  solicitud_id uuid,
  tipo_ayuda_nombre text,
  direccion text,
  persona_nombre text,
  fecha_solicitud date,
  ruta text
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if public.current_role() not in ('administrador', 'aprobador', 'auditor_consulta') then
    raise exception 'No autorizado';
  end if;

  return query
  select
    s.id as solicitud_id,
    ta.nombre as tipo_ayuda_nombre,
    gf.direccion,
    case when p.id is not null then p.nombres || ' ' || p.apellidos else null end as persona_nombre,
    s.fecha_solicitud,
    ('/solicitudes/' || s.id) as ruta
  from public.solicitudes s
  join public.tipos_ayuda ta on ta.id = s.tipo_ayuda_id
  join public.grupos_familiares gf on gf.id = s.grupo_familiar_id
  left join public.personas p on p.id = s.persona_id
  where s.estado = 'en_evaluacion'
    and exists (select 1 from public.evaluaciones_sociales es where es.solicitud_id = s.id)
  order by s.fecha_solicitud;
end;
$$;

grant execute on function public.listar_solicitudes_pendientes_aprobacion_dashboard() to authenticated;

-- "Reembolsos pendientes" = reembolsos aprobados (regular o por excepción)
-- que todavía no tienen pago registrado — mismo criterio que
-- ESTADOS_CON_PAGO_PENDIENTE en solicitudes/[id]/page.tsx.
create or replace function public.listar_reembolsos_pendientes_pago_dashboard()
returns table (
  solicitud_id uuid,
  tipo_ayuda_nombre text,
  direccion text,
  persona_nombre text,
  monto_aprobado numeric,
  ruta text
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if public.current_role() not in ('administrador', 'finanzas', 'auditor_consulta') then
    raise exception 'No autorizado';
  end if;

  return query
  select
    s.id as solicitud_id,
    ta.nombre as tipo_ayuda_nombre,
    gf.direccion,
    case when p.id is not null then p.nombres || ' ' || p.apellidos else null end as persona_nombre,
    ds.monto_aprobado,
    ('/solicitudes/' || s.id) as ruta
  from public.solicitudes s
  join public.tipos_ayuda ta on ta.id = s.tipo_ayuda_id
  join public.grupos_familiares gf on gf.id = s.grupo_familiar_id
  left join public.personas p on p.id = s.persona_id
  left join public.decisiones_solicitud ds on ds.solicitud_id = s.id and ds.decision = 'aprobada'
  where ta.tipo = 'reembolso'
    and s.estado in ('aprobada', 'aprobada_excepcion')
    and not exists (select 1 from public.pagos_reembolso pr where pr.solicitud_id = s.id)
  order by s.fecha_solicitud;
end;
$$;

grant execute on function public.listar_reembolsos_pendientes_pago_dashboard() to authenticated;
