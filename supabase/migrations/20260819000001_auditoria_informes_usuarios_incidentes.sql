-- Auditoría (US-16.01, US-16.04): se suman a la vista unificada tres
-- fuentes que no estaban:
-- * creación de informes sociales (pendiente desde EPIC 16, ver nota en
--   el backlog v2); solo metadatos, nunca el contenido;
-- * cambios de roles y estado de usuarios (profiles_historial), necesarios
--   desde que un usuario puede acumular varios roles;
-- * registro y cambios de incidentes de seguridad (US-26.01).
-- Mismo cuerpo que la versión vigente (20260818000001_roles_multiples.sql)
-- más los tres bloques nuevos al final del UNION ALL.

CREATE OR REPLACE FUNCTION public.listar_eventos_auditoria(p_fecha_desde timestamp with time zone DEFAULT NULL::timestamp with time zone, p_fecha_hasta timestamp with time zone DEFAULT NULL::timestamp with time zone, p_usuario_id uuid DEFAULT NULL::uuid, p_entidad text DEFAULT NULL::text, p_accion text DEFAULT NULL::text, p_limite integer DEFAULT 300)
 RETURNS TABLE(fecha timestamp with time zone, usuario_id uuid, usuario_nombre text, entidad text, entidad_id uuid, accion text, detalle text, ruta text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.tiene_rol(array['administrador', 'auditor_consulta']::public.rol_usuario[]) then
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

    -- US-18.04: cambios de estado de conservación y eliminaciones físicas de
    -- documentos. Sin join a `documentos` para la rama "eliminado" (la fila
    -- ya no existe) — la ruta queda null, igual criterio que otros eventos
    -- sin destino navegable (ver hitos_accesos_denegados más abajo).
    select dh.creado_en, dh.usuario_id,
           'documento', dh.documento_id,
           case dh.campo when 'eliminado' then 'eliminacion' else 'cambio_campo' end,
           (case
             when dh.campo = 'eliminado' then 'Documento eliminado: ' || dh.valor_anterior
             else dh.campo || ': ' || coalesce(dh.valor_anterior, '—') || ' → ' || coalesce(dh.valor_nuevo, '—')
           end),
           (
             select case when d.solicitud_id is not null then '/solicitudes/' || d.solicitud_id
                         else '/hogares/' || d.grupo_familiar_id end
             from public.documentos d
             where d.id = dh.documento_id
           )
    from public.documentos_historial dh

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

    union all

    -- Informes sociales (US-16.01 / EPIC 23): solo que se registró y su
    -- nivel de confidencialidad, nunca el contenido (mismo criterio que
    -- hitos y evaluaciones sociales, CLAUDE.md: datos sensibles).
    select inf.created_at, inf.creado_por,
           'informe_social', inf.id, 'creacion',
           ('Informe social registrado (confidencialidad ' || inf.nivel_confidencialidad::text || ')'),
           ('/hogares/' || inf.grupo_familiar_id)
    from public.informes_sociales inf

    union all

    -- Cambios de roles y de estado de usuarios (US-19.01). Con roles
    -- múltiples, quién le dio a quién permiso para aprobar o ver datos
    -- sensibles es información de auditoría de primer orden.
    select prh.creado_en, prh.usuario_id,
           'usuario', prh.profile_id,
           case prh.campo when 'estado' then 'cambio_estado' else 'cambio_roles' end,
           ((select pr.nombre from public.profiles pr where pr.id = prh.profile_id) || ' · ' || prh.campo || ': ' ||
             coalesce(translate(prh.valor_anterior, '[]"', ''), '—') || ' → ' ||
             coalesce(translate(prh.valor_nuevo, '[]"', ''), '—')),
           ('/admin/usuarios/' || prh.profile_id)
    from public.profiles_historial prh

    union all

    -- Incidentes de seguridad (US-26.01: "el registro queda auditado"):
    -- registro y cambios de campo (estado, medidas, notificación).
    select inc.created_at, inc.creado_por,
           'incidente', inc.id, 'creacion',
           ('Incidente registrado: ' || inc.tipo::text),
           ('/incidentes/' || inc.id)
    from public.incidentes_seguridad inc

    union all

    select ish.creado_en, ish.usuario_id,
           'incidente', ish.incidente_id, 'cambio_campo',
           (ish.campo || ': ' || coalesce(left(ish.valor_anterior, 80), '—') || ' → ' || coalesce(left(ish.valor_nuevo, 80), '—')),
           ('/incidentes/' || ish.incidente_id)
    from public.incidentes_seguridad_historial ish
  ) eventos
  where (p_fecha_desde is null or eventos.fecha >= p_fecha_desde)
    and (p_fecha_hasta is null or eventos.fecha <= p_fecha_hasta)
    and (p_usuario_id is null or eventos.usuario_id = p_usuario_id)
    and (p_entidad is null or eventos.entidad = p_entidad)
    and (p_accion is null or eventos.accion = p_accion)
  order by eventos.fecha desc
  limit p_limite;
end;
$function$;
