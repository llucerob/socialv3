-- MR-08 (ajuste, decisión del cliente 2026-10-28) — el calendario del
-- beneficio se desplaza cuando una entrega se retira con atraso.
--
-- Hasta ahora los períodos eran fijos (septiembre, noviembre... para mes por
-- medio) y un mes atrasado se podía entregar mientras el beneficio siguiera
-- vigente. La regla del cliente:
--   * Un mes atrasado no se entrega. En mensual, el mes que no se retiró se
--     pierde.
--   * En una entrega intermitente (mes por medio, semestral), la entrega se
--     puede retirar con atraso dentro de su plazo, es decir, antes de que le
--     toque la siguiente. Si se retira con atraso, las siguientes se
--     recalculan desde el mes en que se retiró: mes por medio entregada en el
--     mes 1, no retirada en el mes 3, retirada en el mes 4 → la siguiente es
--     el mes 6. Si no se retira dentro del plazo, se pierde y el calendario
--     sigue como estaba.
--   * No hay entregas después del 31 de diciembre, tampoco completar una
--     entrega ya programada.
--
-- Cada período ("slot") se identifica por el mes en que le corresponde
-- (entregas.periodo y movimientos_stock.periodo, como antes). Su plazo va
-- de ese mes hasta el mes anterior al siguiente (en mensual, solo su mes),
-- sin pasar de diciembre. calendario_beneficio() reemplaza a
-- periodos_beneficio() como fuente única del calendario.

create or replace function public.calendario_beneficio(p_beneficio_id uuid)
returns table (
  periodo date,
  ventana_hasta date,
  -- 'entregado' | 'no_entregado' (plazo vencido sin retiro) | 'abierto' (se
  -- puede preparar y entregar ahora) | 'por_venir' (estimado) | 'cancelado'
  -- (beneficio suspendido)
  estado text,
  entrega_id uuid,
  mes_entrega date
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_beneficio public.beneficios%rowtype;
  v_meses integer;
  v_ultimo date;
  v_mes_actual date := public.mes_actual_chile();
  v_inicio date;
  v_fin date;
  v_entrega_id uuid;
  v_mes_entrega date;
begin
  select * into v_beneficio from public.beneficios where id = p_beneficio_id;
  if not found then
    return;
  end if;

  v_meses := case v_beneficio.periodicidad when 'mensual' then 1 when 'mes_por_medio' then 2 else 6 end;
  v_ultimo := date_trunc('month', v_beneficio.vigente_hasta)::date;
  v_inicio := v_beneficio.vigente_desde;

  while v_inicio <= v_ultimo loop
    v_fin := least((v_inicio + make_interval(months => v_meses - 1))::date, v_ultimo);

    -- El mes real de la entrega: el de la captura (online es el momento del
    -- registro; offline, el de la captura en terreno).
    select e.id,
           date_trunc('month', coalesce(e.capturado_en, e.fecha_hora_entrega, now()) at time zone 'America/Santiago')::date
    into v_entrega_id, v_mes_entrega
    from public.entregas e
    where e.solicitud_id = v_beneficio.solicitud_id
      and e.periodo = v_inicio
      and e.estado = 'realizada';

    periodo := v_inicio;
    ventana_hasta := v_fin;

    if found then
      estado := 'entregado';
      entrega_id := v_entrega_id;
      mes_entrega := v_mes_entrega;
      return next;
      -- Retirada con atraso: el calendario se recalcula desde ese mes.
      v_inicio := (greatest(v_mes_entrega, v_inicio) + make_interval(months => v_meses))::date;
    else
      estado := case
        when v_beneficio.estado = 'suspendido' then 'cancelado'
        when v_mes_actual > v_fin then 'no_entregado'
        when v_mes_actual >= v_inicio then 'abierto'
        else 'por_venir'
      end;
      entrega_id := null;
      mes_entrega := null;
      return next;
      v_inicio := (v_inicio + make_interval(months => v_meses))::date;
    end if;
  end loop;
end;
$$;

revoke all on function public.calendario_beneficio(uuid) from public, anon, authenticated;

-- Valida el período de una entrega o salida de stock contra el calendario.
create or replace function public.validar_periodo_beneficio(
  p_solicitud_id uuid,
  p_periodo date,
  p_es_creacion boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_beneficio public.beneficios%rowtype;
  v_estado text;
begin
  select * into v_beneficio from public.beneficios where solicitud_id = p_solicitud_id;

  if not found then
    if p_periodo is not null then
      raise exception 'PERIODO_SIN_BENEFICIO';
    end if;
    return;
  end if;

  if p_periodo is null then
    raise exception 'PERIODO_OBLIGATORIO';
  end if;
  if v_beneficio.estado = 'suspendido' then
    raise exception 'BENEFICIO_SUSPENDIDO';
  end if;
  -- Después del 31 de diciembre no se entrega nada, ni lo ya programado.
  if public.mes_actual_chile() > v_beneficio.vigente_hasta then
    raise exception 'BENEFICIO_VENCIDO';
  end if;

  select c.estado into v_estado
  from public.calendario_beneficio(v_beneficio.id) c
  where c.periodo = p_periodo;

  if not found then
    raise exception 'PERIODO_FUERA_DE_BENEFICIO';
  end if;
  if v_estado = 'por_venir' then
    raise exception 'PERIODO_FUTURO';
  end if;
  if v_estado = 'no_entregado' then
    raise exception 'PERIODO_VENCIDO';
  end if;
  if v_estado = 'entregado' and p_es_creacion then
    raise exception 'PERIODO_YA_ENTREGADO';
  end if;
end;
$$;

revoke all on function public.validar_periodo_beneficio(uuid, date, boolean) from public, anon, authenticated;

-- La solicitud queda entregada cuando el beneficio ya no tiene entregas por
-- delante (lo no retirado a tiempo se perdió).
create or replace function public.marcar_solicitud_entregada_si_corresponde(p_solicitud_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_beneficio_id uuid;
begin
  select id into v_beneficio_id from public.beneficios where solicitud_id = p_solicitud_id;

  if v_beneficio_id is not null and exists (
    select 1 from public.calendario_beneficio(v_beneficio_id) c
    where c.estado in ('abierto', 'por_venir')
  ) then
    return;
  end if;

  update public.solicitudes
  set estado = 'entregada_pagada'
  where id = p_solicitud_id
    and estado in ('aprobada', 'aprobada_excepcion');
end;
$$;

revoke all on function public.marcar_solicitud_entregada_si_corresponde(uuid) from public, anon, authenticated;

-- Lecturas: cambian las columnas, hay que recrearlas.
drop function public.listar_beneficios(uuid, uuid);

create function public.listar_beneficios(
  p_grupo_familiar_id uuid default null,
  p_solicitud_id uuid default null
)
returns table (
  beneficio_id uuid,
  solicitud_id uuid,
  grupo_familiar_id uuid,
  tipo_ayuda_nombre text,
  persona_nombre text,
  periodicidad text,
  modalidad text,
  vigente_desde date,
  vigente_hasta date,
  estado text,
  es_excepcion boolean,
  motivo_suspension text,
  total_periodos integer,
  periodos_entregados integer,
  periodos_no_entregados integer,
  ultima_entrega timestamptz,
  proximo_periodo date
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.tiene_rol(array[
    'administrador', 'evaluador_social', 'aprobador', 'bodega_logistica', 'finanzas', 'auditor_consulta'
  ]::public.rol_usuario[]) then
    raise exception 'No autorizado';
  end if;

  return query
  with calendario as (
    select b.id as beneficio_id, c.periodo, c.estado
    from public.beneficios b
    cross join lateral public.calendario_beneficio(b.id) c
    where (p_grupo_familiar_id is null or b.grupo_familiar_id = p_grupo_familiar_id)
      and (p_solicitud_id is null or b.solicitud_id = p_solicitud_id)
  ),
  resumen as (
    select
      calendario.beneficio_id,
      count(*)::integer as total,
      count(*) filter (where calendario.estado = 'entregado')::integer as entregados,
      count(*) filter (where calendario.estado = 'no_entregado')::integer as no_entregados,
      count(*) filter (where calendario.estado in ('abierto', 'por_venir'))::integer as pendientes,
      min(calendario.periodo) filter (where calendario.estado in ('abierto', 'por_venir')) as proximo
    from calendario
    group by calendario.beneficio_id
  )
  select
    b.id,
    b.solicitud_id,
    b.grupo_familiar_id,
    ta.nombre,
    case when pe.id is not null then pe.nombres || ' ' || pe.apellidos else null end,
    b.periodicidad::text,
    b.modalidad::text,
    b.vigente_desde,
    b.vigente_hasta,
    case
      when b.estado = 'suspendido' then 'suspendido'
      when r.pendientes = 0 and r.entregados > 0 then 'completado'
      when r.pendientes = 0 or public.mes_actual_chile() > b.vigente_hasta then 'vencido'
      else 'vigente'
    end,
    b.es_excepcion,
    b.motivo_suspension,
    r.total,
    r.entregados,
    r.no_entregados,
    (select max(e.fecha_hora_entrega) from public.entregas e
     where e.solicitud_id = b.solicitud_id and e.estado = 'realizada'),
    r.proximo
  from public.beneficios b
  join resumen r on r.beneficio_id = b.id
  join public.solicitudes s on s.id = b.solicitud_id
  join public.tipos_ayuda ta on ta.id = s.tipo_ayuda_id
  left join public.personas pe on pe.id = s.persona_id
  order by b.vigente_desde desc, b.created_at desc;
end;
$$;

grant execute on function public.listar_beneficios(uuid, uuid) to authenticated;

drop function public.listar_periodos_de_beneficio(uuid);

create function public.listar_periodos_de_beneficio(p_solicitud_id uuid)
returns table (
  periodo date,
  ventana_hasta date,
  estado_periodo text,
  mes_entrega date,
  entrega_id uuid,
  estado_entrega text,
  modalidad text,
  fecha_programada date,
  fecha_hora_entrega timestamptz,
  responsable_nombre text,
  receptor_nombre text,
  salida_registrada boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.tiene_rol(array[
    'administrador', 'evaluador_social', 'aprobador', 'bodega_logistica', 'finanzas', 'auditor_consulta'
  ]::public.rol_usuario[]) then
    raise exception 'No autorizado';
  end if;

  return query
  select
    c.periodo,
    c.ventana_hasta,
    c.estado,
    c.mes_entrega,
    e.id,
    e.estado::text,
    e.modalidad::text,
    e.fecha_programada,
    e.fecha_hora_entrega,
    public.nombre_usuario(e.responsable_id),
    e.receptor_nombre,
    exists (
      select 1 from public.movimientos_stock m
      where m.tipo = 'salida' and m.solicitud_id = b.solicitud_id and m.periodo = c.periodo
    )
  from public.beneficios b
  cross join lateral public.calendario_beneficio(b.id) c
  left join public.entregas e on e.solicitud_id = b.solicitud_id and e.periodo = c.periodo
  where b.solicitud_id = p_solicitud_id
  order by c.periodo;
end;
$$;

grant execute on function public.listar_periodos_de_beneficio(uuid) to authenticated;

-- Bodega: los períodos que se pueden preparar y entregar ahora (su plazo
-- está abierto), con hasta cuándo.
drop function public.listar_periodos_por_preparar();

create function public.listar_periodos_por_preparar()
returns table (
  solicitud_id uuid,
  tipo_ayuda_nombre text,
  direccion text,
  sector text,
  persona_nombre text,
  periodo date,
  ventana_hasta date,
  modalidad text,
  es_excepcion boolean,
  salida_registrada boolean,
  estado_entrega text,
  ruta text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.tiene_rol(array['administrador', 'bodega_logistica']::public.rol_usuario[]) then
    raise exception 'No autorizado';
  end if;

  return query
  select
    b.solicitud_id,
    ta.nombre,
    gf.direccion,
    gf.sector,
    case when pe.id is not null then pe.nombres || ' ' || pe.apellidos else null end,
    c.periodo,
    c.ventana_hasta,
    b.modalidad::text,
    b.es_excepcion,
    exists (
      select 1 from public.movimientos_stock m
      where m.tipo = 'salida' and m.solicitud_id = b.solicitud_id and m.periodo = c.periodo
    ),
    e.estado::text,
    ('/solicitudes/' || b.solicitud_id || '?periodo=' || to_char(c.periodo, 'YYYY-MM'))
  from public.beneficios b
  cross join lateral public.calendario_beneficio(b.id) c
  join public.solicitudes s on s.id = b.solicitud_id
  join public.tipos_ayuda ta on ta.id = s.tipo_ayuda_id
  join public.grupos_familiares gf on gf.id = b.grupo_familiar_id
  left join public.personas pe on pe.id = s.persona_id
  left join public.entregas e on e.solicitud_id = b.solicitud_id and e.periodo = c.periodo
  where b.estado = 'vigente'
    and c.estado = 'abierto'
  order by c.ventana_hasta, gf.sector, gf.direccion;
end;
$$;

grant execute on function public.listar_periodos_por_preparar() to authenticated;

-- Reemplazada por calendario_beneficio(): ya nadie la usa.
drop function public.periodos_beneficio(date, date, public.periodicidad_beneficio);
