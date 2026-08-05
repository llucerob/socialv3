-- EPIC 12 — cierre de brecha de integración: la RLS de `entregas`
-- (20260731000002_rls_entregas.sql) solo permite SELECT a administrador,
-- bodega_logistica (todas) y terreno_repartidor (las propias). Eso deja a
-- evaluador_social, aprobador, finanzas y auditor_consulta sin poder leer
-- datos de entrega en ningún lugar de la app (ficha del hogar, detalle de
-- solicitud, dashboard), aunque sí puedan ver el resto de esa misma
-- solicitud/hogar. No es un dato sensible restringido por CLAUDE.md (a
-- diferencia de hitos/informes sociales) — es simple falta de cableado.
--
-- En vez de ensanchar la RLS de `entregas` a todos los roles (expondría la
-- tabla completa vía REST directo), se agregan 3 funciones security definer
-- de solo lectura, una por necesidad puntual — mismo patrón ya usado por
-- reportes (EPIC 17) y auditoría (EPIC 16): chequeo de rol interno en vez de
-- una política RLS amplia. Las acciones de gestión (crear, asignar,
-- reprogramar, completar/fallar) no cambian: siguen exclusivas de
-- administrador/bodega_logistica/terreno_repartidor vía la RLS existente.

-- US-03.04: "ayudas entregadas" en la ficha del hogar. Mismo público que
-- puede ver la ficha completa (ROLES_VER_HOGAR en
-- app/(protected)/hogares/[id]/page.tsx).
create or replace function public.listar_entregas_realizadas_de_hogar(p_grupo_familiar_id uuid)
returns table (
  entrega_id uuid,
  solicitud_id uuid,
  tipo_ayuda_nombre text,
  persona_nombre text,
  fecha_hora_entrega timestamptz,
  receptor_nombre text,
  receptor_relacion text,
  observacion_entrega text,
  ruta text
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if public.current_role() not in (
    'administrador', 'evaluador_social', 'aprobador', 'bodega_logistica', 'finanzas', 'auditor_consulta'
  ) then
    raise exception 'No autorizado';
  end if;

  return query
  select
    e.id as entrega_id,
    e.solicitud_id,
    ta.nombre as tipo_ayuda_nombre,
    case when p.id is not null then p.nombres || ' ' || p.apellidos else null end as persona_nombre,
    e.fecha_hora_entrega,
    e.receptor_nombre,
    e.receptor_relacion,
    e.observacion_entrega,
    ('/solicitudes/' || e.solicitud_id) as ruta
  from public.entregas e
  join public.solicitudes s on s.id = e.solicitud_id
  join public.tipos_ayuda ta on ta.id = s.tipo_ayuda_id
  left join public.personas p on p.id = s.persona_id
  where s.grupo_familiar_id = p_grupo_familiar_id
    and e.estado = 'realizada'
  order by e.fecha_hora_entrega desc nulls last;
end;
$$;

grant execute on function public.listar_entregas_realizadas_de_hogar(uuid) to authenticated;

-- Detalle de solicitud: vista de solo lectura de la entrega para quien no
-- puede gestionarla (todo ROLES_VER_SOLICITUD salvo administrador/
-- bodega_logistica, que ya la ven vía RLS directa + lib/entregas/dal.ts).
create or replace function public.obtener_entrega_lectura_de_solicitud(p_solicitud_id uuid)
returns table (
  entrega_id uuid,
  estado text,
  fecha_programada date,
  responsable_nombre text,
  fecha_hora_entrega timestamptz,
  receptor_nombre text,
  receptor_relacion text,
  observacion_entrega text,
  motivo_fallo_nombre text,
  observacion_fallo text,
  latitud numeric,
  longitud numeric
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if public.current_role() not in (
    'administrador', 'evaluador_social', 'aprobador', 'bodega_logistica', 'finanzas', 'auditor_consulta'
  ) then
    raise exception 'No autorizado';
  end if;

  return query
  select
    e.id as entrega_id,
    e.estado::text,
    e.fecha_programada,
    public.nombre_usuario(e.responsable_id) as responsable_nombre,
    e.fecha_hora_entrega,
    e.receptor_nombre,
    e.receptor_relacion,
    e.observacion_entrega,
    mf.nombre as motivo_fallo_nombre,
    e.observacion_fallo,
    e.latitud,
    e.longitud
  from public.entregas e
  left join public.motivos_entrega_fallida mf on mf.id = e.motivo_fallo
  where e.solicitud_id = p_solicitud_id;
end;
$$;

grant execute on function public.obtener_entrega_lectura_de_solicitud(uuid) to authenticated;

-- Dashboard: tarjeta "Entregas pendientes" (lib/dashboard/sections.ts), ya
-- asignada desde EPIC 02 a administrador/bodega_logistica/terreno_repartidor/
-- auditor_consulta. terreno solo ve las propias (mismo criterio que
-- listarMisEntregas/RLS); el resto ve todas. Sin límite: volumen bajo
-- (comuna pequeña, CLAUDE.md sección 1).
create or replace function public.listar_entregas_pendientes_para_dashboard()
returns table (
  entrega_id uuid,
  solicitud_id uuid,
  tipo_ayuda_nombre text,
  direccion text,
  fecha_programada date,
  ruta text
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if public.current_role() not in ('administrador', 'bodega_logistica', 'terreno_repartidor', 'auditor_consulta') then
    raise exception 'No autorizado';
  end if;

  return query
  select
    e.id as entrega_id,
    e.solicitud_id,
    ta.nombre as tipo_ayuda_nombre,
    gf.direccion,
    e.fecha_programada,
    ('/solicitudes/' || e.solicitud_id) as ruta
  from public.entregas e
  join public.solicitudes s on s.id = e.solicitud_id
  join public.tipos_ayuda ta on ta.id = s.tipo_ayuda_id
  join public.grupos_familiares gf on gf.id = s.grupo_familiar_id
  where e.estado in ('pendiente', 'fallida')
    and (public.current_role() != 'terreno_repartidor' or e.responsable_id = auth.uid())
  order by e.fecha_programada nulls last, e.created_at;
end;
$$;

grant execute on function public.listar_entregas_pendientes_para_dashboard() to authenticated;
