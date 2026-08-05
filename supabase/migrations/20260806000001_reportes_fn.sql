-- EPIC 17 — Reportes operativos (US-17.01 a US-17.05; la exportación CSV de
-- US-17.06 se resuelve en la capa de aplicación, reutilizando estas mismas
-- funciones — ver app/api/reportes/[reporte]/export/route.ts).
--
-- Mismo criterio que EPIC 16 (ver 20260805000001_auditoria_fn.sql): estos
-- reportes cruzan varias tablas (solicitudes, decisiones_solicitud,
-- pagos_reembolso, entregas, grupos_familiares, tipos_ayuda, personas) para
-- roles que hoy no tienen SELECT directo sobre todas ellas (finanzas,
-- auditor_consulta, bodega_logistica) — en vez de ensanchar la RLS de cada
-- tabla, se agrega una función security definer por reporte, con su propio
-- chequeo de rol interno (el mismo "como <rol>, quiero..." de cada historia).
--
-- CLAUDE.md: "las excepciones nunca se ocultan" — todo reporte que puede
-- incluir una solicitud aprobada por excepción expone es_excepcion/
-- tiene_excepcion (estado = 'aprobada_excepcion'), en vez de omitirla.
--
-- La distinción "reembolso general" vs "diálisis" no tiene columna propia
-- (ver reglas_tipos_ayuda.sql y el comentario de lib/reembolsos/tramos.ts):
-- se compara tipos_ayuda.nombre contra los mismos dos literales exportados
-- por ese archivo (NOMBRE_TIPO_AYUDA_REEMBOLSO_GENERAL /
-- NOMBRE_TIPO_AYUDA_REEMBOLSO_DIALISIS). Si esos nombres cambian, esta
-- migración y ese archivo deben actualizarse juntos.

-- US-17.01 — "ayudas entregadas por período... filtrar por tipo de ayuda...
-- por sector... cantidad de ayudas (= cantidad de filas) ... listado
-- exportable". Una "ayuda entregada" es una solicitud en estado
-- 'entregada_pagada' — el mismo estado terminal tanto para ayudas físicas
-- (EPIC 12: entregas.estado='realizada') como para reembolsos (EPIC 14:
-- pagos_reembolso), ver el comentario de marcar_solicitud_reembolso_pagada_fn.sql.
-- La fecha efectiva es la de entrega física o la de pago, la que exista.
create or replace function public.reporte_ayudas_entregadas(
  p_fecha_desde date default null,
  p_fecha_hasta date default null,
  p_tipo_ayuda_id uuid default null,
  p_sector text default null,
  p_limite integer default 500
)
returns table (
  solicitud_id uuid,
  fecha date,
  tipo_ayuda_id uuid,
  tipo_ayuda_nombre text,
  grupo_familiar_id uuid,
  sector text,
  direccion text,
  persona_nombre text,
  monto numeric,
  es_excepcion boolean,
  ruta text
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if public.current_role() not in ('administrador', 'auditor_consulta') then
    raise exception 'No autorizado';
  end if;

  return query
  with base as (
    select
      s.id as solicitud_id,
      coalesce(e.fecha_hora_entrega::date, pr.fecha_pago) as fecha,
      ta.id as tipo_ayuda_id,
      ta.nombre as tipo_ayuda_nombre,
      gf.id as grupo_familiar_id,
      gf.sector,
      gf.direccion,
      case when p.id is not null then p.nombres || ' ' || p.apellidos else null end as persona_nombre,
      ds.monto_aprobado as monto,
      (s.estado = 'aprobada_excepcion') as es_excepcion,
      ('/solicitudes/' || s.id) as ruta
    from public.solicitudes s
    join public.tipos_ayuda ta on ta.id = s.tipo_ayuda_id
    join public.grupos_familiares gf on gf.id = s.grupo_familiar_id
    left join public.personas p on p.id = s.persona_id
    left join public.entregas e on e.solicitud_id = s.id
    left join public.pagos_reembolso pr on pr.solicitud_id = s.id
    left join public.decisiones_solicitud ds on ds.solicitud_id = s.id and ds.decision = 'aprobada'
    where s.estado = 'entregada_pagada'
  )
  select *
  from base
  where (p_fecha_desde is null or base.fecha >= p_fecha_desde)
    and (p_fecha_hasta is null or base.fecha <= p_fecha_hasta)
    and (p_tipo_ayuda_id is null or base.tipo_ayuda_id = p_tipo_ayuda_id)
    and (p_sector is null or base.sector = p_sector)
  order by base.fecha desc nulls last
  limit p_limite;
end;
$$;

grant execute on function public.reporte_ayudas_entregadas(date, date, uuid, text, integer) to authenticated;

-- US-17.02 — "hogares beneficiados... cantidad de hogares beneficiados...
-- filtrar por período... por sector... ver detalle de ayudas por hogar". El
-- "detalle por hogar" es la ficha existente /hogares/[id] (US-03.04 ya
-- muestra el historial de ayudas del hogar) — este reporte solo agrega y
-- enlaza, no duplica esa vista.
create or replace function public.reporte_hogares_beneficiados(
  p_fecha_desde date default null,
  p_fecha_hasta date default null,
  p_sector text default null,
  p_limite integer default 500
)
returns table (
  grupo_familiar_id uuid,
  direccion text,
  sector text,
  cantidad_ayudas bigint,
  fecha_ultima_ayuda date,
  ruta text
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if public.current_role() not in ('administrador', 'auditor_consulta') then
    raise exception 'No autorizado';
  end if;

  return query
  with base as (
    select
      gf.id as grupo_familiar_id,
      gf.direccion,
      gf.sector,
      coalesce(e.fecha_hora_entrega::date, pr.fecha_pago) as fecha
    from public.solicitudes s
    join public.grupos_familiares gf on gf.id = s.grupo_familiar_id
    left join public.entregas e on e.solicitud_id = s.id
    left join public.pagos_reembolso pr on pr.solicitud_id = s.id
    where s.estado = 'entregada_pagada'
  )
  select
    base.grupo_familiar_id,
    base.direccion,
    base.sector,
    count(*) as cantidad_ayudas,
    max(base.fecha) as fecha_ultima_ayuda,
    ('/hogares/' || base.grupo_familiar_id) as ruta
  from base
  where (p_fecha_desde is null or base.fecha >= p_fecha_desde)
    and (p_fecha_hasta is null or base.fecha <= p_fecha_hasta)
    and (p_sector is null or base.sector = p_sector)
  group by base.grupo_familiar_id, base.direccion, base.sector
  order by cantidad_ayudas desc
  limit p_limite;
end;
$$;

grant execute on function public.reporte_hogares_beneficiados(date, date, text, integer) to authenticated;

-- US-17.03 — "reembolsos médicos aprobados y pagados... monto solicitado,
-- aprobado, pagado... filtrar por período... por tipo de reembolso". A
-- diferencia de US-17.01 (solo lo ya entregado/pagado), este reporte
-- financiero muestra el ciclo completo de cada solicitud de reembolso desde
-- que se ingresa (para que finanzas vea también lo pendiente de decisión o
-- de pago), excluyendo solo borrador/anulada.
create or replace function public.reporte_reembolsos_medicos(
  p_fecha_desde date default null,
  p_fecha_hasta date default null,
  p_tipo_reembolso text default null,
  p_limite integer default 500
)
returns table (
  solicitud_id uuid,
  fecha_solicitud date,
  tipo_reembolso_nombre text,
  grupo_familiar_id uuid,
  direccion text,
  persona_nombre text,
  monto_solicitado numeric,
  monto_aprobado numeric,
  monto_pagado numeric,
  estado text,
  es_excepcion boolean,
  ruta text
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if public.current_role() not in ('administrador', 'finanzas') then
    raise exception 'No autorizado';
  end if;

  if p_tipo_reembolso is not null and p_tipo_reembolso not in ('general', 'dialisis') then
    raise exception 'Tipo de reembolso inválido: %', p_tipo_reembolso;
  end if;

  return query
  select
    s.id as solicitud_id,
    s.fecha_solicitud,
    ta.nombre as tipo_reembolso_nombre,
    gf.id as grupo_familiar_id,
    gf.direccion,
    case when p.id is not null then p.nombres || ' ' || p.apellidos else null end as persona_nombre,
    s.monto_solicitado,
    ds.monto_aprobado,
    pr.monto_pagado,
    s.estado::text,
    (s.estado = 'aprobada_excepcion') as es_excepcion,
    ('/solicitudes/' || s.id) as ruta
  from public.solicitudes s
  join public.tipos_ayuda ta on ta.id = s.tipo_ayuda_id
  join public.grupos_familiares gf on gf.id = s.grupo_familiar_id
  left join public.personas p on p.id = s.persona_id
  left join public.decisiones_solicitud ds on ds.solicitud_id = s.id and ds.decision = 'aprobada'
  left join public.pagos_reembolso pr on pr.solicitud_id = s.id
  where ta.tipo = 'reembolso'
    and s.estado not in ('borrador', 'anulada')
    and (p_fecha_desde is null or s.fecha_solicitud >= p_fecha_desde)
    and (p_fecha_hasta is null or s.fecha_solicitud <= p_fecha_hasta)
    and (
      p_tipo_reembolso is null
      or (p_tipo_reembolso = 'general' and ta.nombre = 'Reembolso médico general')
      or (p_tipo_reembolso = 'dialisis' and ta.nombre = 'Reembolso médico por diálisis')
    )
  order by s.fecha_solicitud desc
  limit p_limite;
end;
$$;

grant execute on function public.reporte_reembolsos_medicos(date, date, text, integer) to authenticated;

-- US-17.04 — "reembolsos por diálisis y acumulados mensuales... tope de
-- $150.000... beneficiario, mes, monto acumulado, saldo disponible,
-- excepciones si existen". Mismo criterio de cómputo que
-- calcularAcumuladoDialisisMensual (lib/reembolsos/dal.ts, US-15.03): suma
-- de decisiones aprobadas del mes calendario, agrupada por persona
-- beneficiaria. El tope ($150.000) queda hardcodeado aquí a propósito, con
-- el mismo valor que TOPE_MENSUAL_DIALISIS en lib/reembolsos/tramos.ts — si
-- ese valor cambia, debe actualizarse en ambos lugares.
create or replace function public.reporte_dialisis_mensual(
  p_anio integer default null,
  p_mes integer default null,
  p_persona_id uuid default null,
  p_limite integer default 500
)
returns table (
  persona_id uuid,
  persona_nombre text,
  grupo_familiar_id uuid,
  anio integer,
  mes integer,
  monto_acumulado numeric,
  saldo_disponible numeric,
  tiene_excepcion boolean
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
    p.id as persona_id,
    (p.nombres || ' ' || p.apellidos) as persona_nombre,
    p.grupo_familiar_id,
    extract(year from s.fecha_solicitud)::integer as anio,
    extract(month from s.fecha_solicitud)::integer as mes,
    sum(coalesce(ds.monto_aprobado, 0)) as monto_acumulado,
    greatest(0, 150000 - sum(coalesce(ds.monto_aprobado, 0))) as saldo_disponible,
    bool_or(s.estado = 'aprobada_excepcion') as tiene_excepcion
  from public.decisiones_solicitud ds
  join public.solicitudes s on s.id = ds.solicitud_id
  join public.tipos_ayuda ta on ta.id = s.tipo_ayuda_id
  join public.personas p on p.id = s.persona_id
  where ds.decision = 'aprobada'
    and ta.nombre = 'Reembolso médico por diálisis'
    and (p_anio is null or extract(year from s.fecha_solicitud)::integer = p_anio)
    and (p_mes is null or extract(month from s.fecha_solicitud)::integer = p_mes)
    and (p_persona_id is null or p.id = p_persona_id)
  group by p.id, p.nombres, p.apellidos, p.grupo_familiar_id,
           extract(year from s.fecha_solicitud), extract(month from s.fecha_solicitud)
  order by anio desc, mes desc, persona_nombre
  limit p_limite;
end;
$$;

grant execute on function public.reporte_dialisis_mensual(integer, integer, uuid, integer) to authenticated;

-- US-17.05 — "entregas pendientes y fallidas... filtrar por responsable...
-- por sector... ver motivo de falla".
create or replace function public.reporte_entregas_pendientes_fallidas(
  p_estado text default null,
  p_responsable_id uuid default null,
  p_sector text default null,
  p_limite integer default 500
)
returns table (
  entrega_id uuid,
  solicitud_id uuid,
  estado text,
  fecha_programada date,
  responsable_id uuid,
  responsable_nombre text,
  tipo_ayuda_nombre text,
  sector text,
  direccion text,
  motivo_fallo text,
  observacion_fallo text,
  ruta text
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if public.current_role() not in ('administrador', 'bodega_logistica') then
    raise exception 'No autorizado';
  end if;

  if p_estado is not null and p_estado not in ('pendiente', 'fallida') then
    raise exception 'Estado inválido: %', p_estado;
  end if;

  return query
  select
    e.id as entrega_id,
    e.solicitud_id,
    e.estado::text,
    e.fecha_programada,
    e.responsable_id,
    public.nombre_usuario(e.responsable_id) as responsable_nombre,
    ta.nombre as tipo_ayuda_nombre,
    gf.sector,
    gf.direccion,
    e.motivo_fallo::text,
    e.observacion_fallo,
    ('/solicitudes/' || e.solicitud_id) as ruta
  from public.entregas e
  join public.solicitudes s on s.id = e.solicitud_id
  join public.tipos_ayuda ta on ta.id = s.tipo_ayuda_id
  join public.grupos_familiares gf on gf.id = s.grupo_familiar_id
  where e.estado in ('pendiente', 'fallida')
    and (p_estado is null or e.estado::text = p_estado)
    and (p_responsable_id is null or e.responsable_id = p_responsable_id)
    and (p_sector is null or gf.sector = p_sector)
  order by e.fecha_programada nulls last, e.created_at
  limit p_limite;
end;
$$;

grant execute on function public.reporte_entregas_pendientes_fallidas(text, uuid, text, integer) to authenticated;
