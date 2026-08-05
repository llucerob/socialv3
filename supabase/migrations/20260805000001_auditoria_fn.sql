-- EPIC 16 — Auditoría y trazabilidad (US-16.01 a US-16.04).
--
-- US-16.01/16.02/16.03 (registrar creación de entidades críticas, cambios de
-- estado de solicitudes, aprobación/rechazo/monto/excepciones) ya están
-- satisfechas por la infraestructura de auditoría construida incrementalmente
-- en cada EPIC anterior: creado_por/created_at en cada tabla crítica
-- (grupos_familiares, personas, solicitudes, documentos, tipos_ayuda,
-- entregas), las tablas *_historial + sus triggers log_*_cambio() (EPIC 03,
-- 04, 06, 07, 12), y las tablas insert-only decisiones_solicitud/
-- pagos_reembolso (EPIC 09, 14) que ya son su propio registro inmutable de
-- aprobación/rechazo/monto/pago. Ninguna de esas tablas se duplica aquí.
--
-- Lo único que falta es US-16.04 ("consultar auditoría"): hoy esa
-- información vive repartida en ~10 tablas con esquemas distintos, y
-- auditor_consulta no tiene RLS de lectura sobre ninguna de ellas (nació en
-- US-01.03 sin ningún permiso real todavía). Ensanchar la RLS de cada tabla
-- para incluir auditor_consulta serviría, pero mezclaría "quién opera el
-- día a día" (evaluador_social/administrador, ya definido por cada EPIC)
-- con "quién audita" — y no da una vista unificada, filtrable por
-- fecha/usuario/entidad/acción como pide el criterio de aceptación.
--
-- Por eso esta migración agrega dos funciones security definer (mismo
-- patrón que nombre_usuario()/listar_funcionarios_terreno()): normalizan y
-- unen (UNION ALL) los eventos de todas esas tablas en una forma común, con
-- su propio chequeo de rol interno (administrador, auditor_consulta) — sin
-- tocar ninguna RLS ni trigger existente.
--
-- Deliberadamente EXCLUIDO de esta vista (CLAUDE.md: "Hitos e informes
-- sociales son datos sensibles... Terreno, bodega y compras nunca acceden a
-- ellos"; ver también el comentario de rls_hitos.sql que excluye
-- explícitamente a auditor_consulta de hitos): el contenido de `hitos` y de
-- `evaluaciones_sociales` (comentario/fundamento). Sí se incluye
-- hitos_accesos_denegados (US-22.03), porque esa tabla registra un intento
-- de acceso denegado — un evento de seguridad, no contenido sensible — y su
-- propio comentario en rls_hitos.sql anticipa que se una "al resto de
-- auditoría" cuando existiera EPIC 16.
create or replace function public.listar_eventos_auditoria(
  p_fecha_desde timestamptz default null,
  p_fecha_hasta timestamptz default null,
  p_usuario_id uuid default null,
  p_entidad text default null,
  p_accion text default null,
  p_limite integer default 300
)
returns table (
  fecha timestamptz,
  usuario_id uuid,
  usuario_nombre text,
  entidad text,
  entidad_id uuid,
  accion text,
  detalle text,
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
  select eventos.fecha, eventos.usuario_id, public.nombre_usuario(eventos.usuario_id),
         eventos.entidad, eventos.entidad_id, eventos.accion, eventos.detalle, eventos.ruta
  from (
    -- Creación de hogares (US-16.01)
    select gf.created_at as fecha, gf.creado_por as usuario_id,
           'grupo_familiar'::text as entidad, gf.id as entidad_id,
           'creacion'::text as accion,
           ('Hogar creado: ' || gf.direccion) as detalle,
           ('/hogares/' || gf.id) as ruta
    from public.grupos_familiares gf

    union all

    -- Cambios críticos de hogares (tramo_rsh, estado)
    select gfh.creado_en, gfh.usuario_id,
           'grupo_familiar', gfh.grupo_familiar_id,
           'cambio_campo',
           (gfh.campo || ': ' || coalesce(gfh.valor_anterior, '—') || ' → ' || coalesce(gfh.valor_nuevo, '—')),
           ('/hogares/' || gfh.grupo_familiar_id)
    from public.grupos_familiares_historial gfh

    union all

    -- Creación de personas (US-16.01)
    select p.created_at, p.creado_por,
           'persona', p.id, 'creacion',
           ('Integrante creado: ' || p.nombres || ' ' || p.apellidos),
           ('/hogares/' || p.grupo_familiar_id)
    from public.personas p

    union all

    -- Cambios de personas
    select ph.creado_en, ph.usuario_id,
           'persona', ph.persona_id, 'cambio_campo',
           (ph.campo || ': ' || coalesce(ph.valor_anterior, '—') || ' → ' || coalesce(ph.valor_nuevo, '—')),
           ('/hogares/' || (select pe.grupo_familiar_id from public.personas pe where pe.id = ph.persona_id))
    from public.personas_historial ph

    union all

    -- Creación de solicitudes (US-16.01)
    select s.created_at, s.creado_por,
           'solicitud', s.id, 'creacion',
           ('Solicitud creada: ' || s.motivo),
           ('/solicitudes/' || s.id)
    from public.solicitudes s

    union all

    -- Cambios de estado de solicitudes y decisiones del sistema (US-16.02):
    -- estado/tipo_ayuda_id/persona_id (trigger genérico) + validacion_rsh,
    -- motivo_observacion, tope_reembolso (RPCs de auditoría explícita).
    select sh.creado_en, sh.usuario_id,
           'solicitud',
           sh.solicitud_id,
           case sh.campo
             when 'estado' then 'cambio_estado'
             when 'validacion_rsh' then 'validacion_rsh'
             when 'motivo_observacion' then 'observacion'
             when 'tope_reembolso' then 'bloqueo_tope'
             else 'cambio_campo'
           end,
           (sh.campo || ': ' || coalesce(sh.valor_anterior, '—') || ' → ' || coalesce(sh.valor_nuevo, '—')),
           ('/solicitudes/' || sh.solicitud_id)
    from public.solicitudes_historial sh

    union all

    -- Subida de documentos (US-16.01). Solo metadata (nombre/tipo), nunca
    -- el contenido del archivo.
    select d.created_at, d.subido_por,
           'documento', d.id, 'creacion',
           ('Documento subido: ' || d.nombre_archivo || ' (' || d.tipo_documento::text || ')'),
           (case when d.solicitud_id is not null then '/solicitudes/' || d.solicitud_id
                 else '/hogares/' || d.grupo_familiar_id end)
    from public.documentos d

    union all

    -- Creación del catálogo de tipos de ayuda (excluye la siembra inicial,
    -- que no tiene un usuario real: creado_por es null en esas 5 filas).
    select ta.created_at, ta.creado_por,
           'tipo_ayuda', ta.id, 'creacion',
           ('Tipo de ayuda creado: ' || ta.nombre),
           ('/ayudas/' || ta.id)
    from public.tipos_ayuda ta
    where ta.creado_por is not null

    union all

    -- Cambios al catálogo de tipos de ayuda
    select tah.creado_en, tah.usuario_id,
           'tipo_ayuda', tah.tipo_ayuda_id, 'cambio_campo',
           (tah.campo || ': ' || coalesce(tah.valor_anterior, '—') || ' → ' || coalesce(tah.valor_nuevo, '—')),
           ('/ayudas/' || tah.tipo_ayuda_id)
    from public.tipos_ayuda_historial tah

    union all

    -- Cambios de entregas (asignación, entrega realizada/fallida)
    select eh.creado_en, eh.usuario_id,
           'entrega', eh.entrega_id, 'cambio_campo',
           (eh.campo || ': ' || coalesce(eh.valor_anterior, '—') || ' → ' || coalesce(eh.valor_nuevo, '—')),
           ('/solicitudes/' || (select e.solicitud_id from public.entregas e where e.id = eh.entrega_id))
    from public.entregas_historial eh

    union all

    -- Aprobación / rechazo / monto / excepciones (US-16.03). La excepción
    -- RSH/diálisis queda visible como el estado 'aprobada_excepcion' en
    -- solicitudes_historial (arriba); aquí queda el detalle de la decisión.
    select ds.created_at, ds.aprobador_id,
           'solicitud', ds.solicitud_id,
           case ds.decision when 'aprobada' then 'aprobacion' else 'rechazo' end,
           (
             initcap(ds.decision::text) ||
             case when ds.monto_aprobado is not null then ' · monto: $' || ds.monto_aprobado::text else '' end ||
             case when ds.cantidad_aprobada is not null then ' · cantidad: ' || ds.cantidad_aprobada else '' end ||
             case when ds.comentario is not null then ' · ' || ds.comentario else '' end
           ),
           ('/solicitudes/' || ds.solicitud_id)
    from public.decisiones_solicitud ds

    union all

    -- Pagos de reembolso (US-16.03: cambios de monto también cubre el pago
    -- efectivo de un reembolso aprobado, EPIC 14)
    select pr.created_at, pr.registrado_por,
           'solicitud', pr.solicitud_id, 'pago',
           ('Pago registrado: $' || pr.monto_pagado::text || ' (' || pr.medio_pago || ')'),
           ('/solicitudes/' || pr.solicitud_id)
    from public.pagos_reembolso pr

    union all

    -- Movimientos de inventario (entradas/salidas de stock, EPIC 11)
    select ms.created_at, ms.registrado_por,
           'producto', ms.producto_id, ms.tipo::text,
           (ms.tipo::text || ': ' || ms.cantidad::text ||
             case when ms.observacion is not null then ' · ' || ms.observacion else '' end),
           ('/inventario/' || ms.producto_id)
    from public.movimientos_stock ms

    union all

    -- Intentos de acceso denegado a hitos (US-22.03), no el contenido de
    -- los hitos en sí.
    select had.creado_en, had.usuario_id,
           'hito', had.id, 'acceso_denegado',
           ('Acceso denegado (rol ' || coalesce(had.rol_en_intento, '—') || ') a ' || had.ruta),
           (case when had.grupo_familiar_id is not null then '/hogares/' || had.grupo_familiar_id else null end)
    from public.hitos_accesos_denegados had
  ) eventos
  where (p_fecha_desde is null or eventos.fecha >= p_fecha_desde)
    and (p_fecha_hasta is null or eventos.fecha <= p_fecha_hasta)
    and (p_usuario_id is null or eventos.usuario_id = p_usuario_id)
    and (p_entidad is null or eventos.entidad = p_entidad)
    and (p_accion is null or eventos.accion = p_accion)
  order by eventos.fecha desc
  limit p_limite;
end;
$$;

grant execute on function public.listar_eventos_auditoria(timestamptz, timestamptz, uuid, text, text, integer) to authenticated;

-- Lista de usuarios para el filtro "por usuario" de US-16.04. Mismo criterio
-- que listar_funcionarios_terreno(): expone solo id/nombre/rol, no la fila
-- completa de profiles, y con el mismo chequeo de rol que la función anterior.
create or replace function public.listar_usuarios_para_auditoria()
returns table (id uuid, nombre text, rol public.rol_usuario)
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
  select pr.id, pr.nombre, pr.rol
  from public.profiles pr
  order by pr.nombre;
end;
$$;

grant execute on function public.listar_usuarios_para_auditoria() to authenticated;
