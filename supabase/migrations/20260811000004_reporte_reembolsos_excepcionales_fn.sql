-- 🆕 EPIC 25 (US-25.07) — "reembolsos excepcionales por cirugía y
-- fallecimiento... se muestran por separado de los reembolsos generales y de
-- diálisis · filtrable por tipo y por período".
--
-- Se crea una función propia en vez de parametrizar reporte_reembolsos_medicos
-- (20260806000001_reportes_fn.sql): mismo criterio que reporte_dialisis_mensual,
-- que ya es una función independiente en vez de una rama de esa misma
-- función. Esto evita que el filtro "Todos" de /reportes/reembolsos-medicos
-- mezcle silenciosamente filas excepcionales, y evita tocar un reporte de
-- EPIC 17 ya implementado y probado.
--
-- Como el 100% de las filas de este reporte son, por definición, un
-- reembolso excepcional, se expone tipo_excepcion ('cirugia'/'fallecimiento')
-- en vez de un booleano es_excepcion (CLAUDE.md: "las excepciones nunca se
-- ocultan" — aquí el nombre completo del tipo de ayuda ya lo dice todo, y
-- tipo_excepcion es el mismo dato en forma de slug corto para filtrar).
create or replace function public.reporte_reembolsos_excepcionales(
  p_fecha_desde date default null,
  p_fecha_hasta date default null,
  p_tipo_excepcion text default null,
  p_limite integer default 500
)
returns table (
  solicitud_id uuid,
  fecha_solicitud date,
  tipo_excepcion text,
  tipo_reembolso_nombre text,
  grupo_familiar_id uuid,
  direccion text,
  persona_nombre text,
  monto_solicitado numeric,
  monto_aprobado numeric,
  monto_pagado numeric,
  estado text,
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

  if p_tipo_excepcion is not null and p_tipo_excepcion not in ('cirugia', 'fallecimiento') then
    raise exception 'Tipo de excepción inválido: %', p_tipo_excepcion;
  end if;

  return query
  select
    s.id as solicitud_id,
    s.fecha_solicitud,
    case
      when ta.nombre = 'Reembolso excepcional por cirugía' then 'cirugia'
      else 'fallecimiento'
    end as tipo_excepcion,
    ta.nombre as tipo_reembolso_nombre,
    gf.id as grupo_familiar_id,
    gf.direccion,
    case when p.id is not null then p.nombres || ' ' || p.apellidos else null end as persona_nombre,
    s.monto_solicitado,
    ds.monto_aprobado,
    pr.monto_pagado,
    s.estado::text,
    ('/solicitudes/' || s.id) as ruta
  from public.solicitudes s
  join public.tipos_ayuda ta on ta.id = s.tipo_ayuda_id
  join public.grupos_familiares gf on gf.id = s.grupo_familiar_id
  left join public.personas p on p.id = s.persona_id
  left join public.decisiones_solicitud ds on ds.solicitud_id = s.id and ds.decision = 'aprobada'
  left join public.pagos_reembolso pr on pr.solicitud_id = s.id
  where ta.nombre in ('Reembolso excepcional por cirugía', 'Reembolso excepcional por fallecimiento o servicio funerario')
    and s.estado not in ('borrador', 'anulada')
    and (p_fecha_desde is null or s.fecha_solicitud >= p_fecha_desde)
    and (p_fecha_hasta is null or s.fecha_solicitud <= p_fecha_hasta)
    and (
      p_tipo_excepcion is null
      or (p_tipo_excepcion = 'cirugia' and ta.nombre = 'Reembolso excepcional por cirugía')
      or (p_tipo_excepcion = 'fallecimiento' and ta.nombre = 'Reembolso excepcional por fallecimiento o servicio funerario')
    )
  order by s.fecha_solicitud desc
  limit p_limite;
end;
$$;

grant execute on function public.reporte_reembolsos_excepcionales(date, date, text, integer) to authenticated;
