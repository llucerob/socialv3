-- US-18.04 — Política de retención básica.
-- "Como administrador, quiero definir estado de conservación de
-- documentos, para preparar gestión futura de eliminación o bloqueo."
-- Estados sugeridos por el backlog: vigente, vencido, reemplazado,
-- bloqueado, eliminable.
create type public.estado_retencion_documento as enum (
  'vigente',
  'vencido',
  'reemplazado',
  'bloqueado',
  'eliminable'
);

alter table public.documentos
  add column estado_retencion public.estado_retencion_documento not null default 'vigente';

-- Historial dedicado (mismo patrón que solicitudes_historial/
-- entregas_historial/etc.): documentos no tenía tabla de auditoría propia
-- porque hasta ahora era insert-only ("un documento subido no se reemplaza
-- ni se borra en este alcance", EPIC 10). US-18.04 introduce la primera
-- mutación real (cambio de estado de conservación) y la primera eliminación
-- física — ambas deben quedar auditadas ("la acción queda auditada").
--
-- Sin foreign key a documentos: a diferencia del resto de *_historial (que
-- referencian una fila que sigue existiendo), una fila de "eliminado" debe
-- sobrevivir después de que el documento referenciado ya no exista.
create table public.documentos_historial (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null,
  campo text not null,
  valor_anterior text,
  valor_nuevo text,
  usuario_id uuid references auth.users (id),
  creado_en timestamptz not null default now()
);

create index documentos_historial_documento_id_idx on public.documentos_historial (documento_id);

create or replace function public.log_documento_cambio_retencion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado_retencion is distinct from old.estado_retencion then
    insert into public.documentos_historial (documento_id, campo, valor_anterior, valor_nuevo, usuario_id)
    values (new.id, 'estado_retencion', old.estado_retencion::text, new.estado_retencion::text, auth.uid());
  end if;

  return new;
end;
$$;

create trigger documentos_audit_cambio_retencion
after update on public.documentos
for each row
execute function public.log_documento_cambio_retencion();

create or replace function public.log_documento_eliminado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.documentos_historial (documento_id, campo, valor_anterior, valor_nuevo, usuario_id)
  values (old.id, 'eliminado', old.nombre_archivo, null, auth.uid());

  return old;
end;
$$;

create trigger documentos_audit_eliminacion
before delete on public.documentos
for each row
execute function public.log_documento_eliminado();

-- Historial: mismo público autorizado a ver todo documento (ver
-- puede_ver_documento) tendría que resolverse por documento — como acceso
-- directo al historial no está pedido por ninguna historia (no hay "ver
-- historial de un documento" en los criterios de aceptación) y el detalle
-- (nombre de archivo, estado anterior/nuevo) no es más sensible que lo que
-- ya expone el propio documento, se restringe simplemente a quien gestiona
-- retención/eliminación: administrador.
alter table public.documentos_historial enable row level security;

create policy "documentos_historial_select_admin"
on public.documentos_historial
for select
to authenticated
using (public.is_admin());

grant select on public.documentos_historial to authenticated;

-- "Como administrador, quiero definir estado de conservación" — transición
-- puntual y acotada a una sola columna, misma razón que
-- marcar_solicitud_entregada/marcar_solicitud_reembolso_pagada: una política
-- RLS de UPDATE con grant de columna amplio a `authenticated` no sirve aquí,
-- porque documentos ya tiene otra política de UPDATE permisiva para
-- administrador/evaluador_social/finanzas (validación, US-14.02) — cualquier
-- política de UPDATE que pase autoriza el UPDATE completo si la columna
-- tiene grant, sin importar cuál política fue la que lo permitió. Una
-- función security definer evita ese problema por construcción.
--
-- IMPORTANTE: el chequeo de rol de abajo NO es opcional — ver incluido en
-- cada función similar del proyecto.
create or replace function public.actualizar_estado_retencion_documento(
  p_documento_id uuid,
  p_estado_retencion public.estado_retencion_documento
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  update public.documentos
  set estado_retencion = p_estado_retencion
  where id = p_documento_id;
end;
$$;

grant execute on function public.actualizar_estado_retencion_documento(uuid, public.estado_retencion_documento) to authenticated;

-- "No se elimina físicamente sin rol autorizado" — a diferencia del UPDATE
-- de arriba, DELETE no tiene el mismo riesgo de "otra política ya permisiva
-- abre la puerta" (es la primera y única política DELETE de la tabla), así
-- que una política RLS directa es suficiente y más simple que una función.
create policy "documentos_delete_admin"
on public.documentos
for delete
to authenticated
using (public.is_admin());

grant delete on public.documentos to authenticated;

-- storage.objects: mismo criterio, para que borrar la fila y borrar el
-- archivo del bucket sean ambos posibles solo para administrador (Server
-- Action, ver lib/documentos/actions.ts).
create policy "documentos_storage_delete_admin"
on storage.objects
for delete
to authenticated
using (bucket_id = 'documentos' and public.is_admin());

-- Suma los eventos de retención/eliminación de documentos a la vista
-- unificada de auditoría (EPIC 16/US-16.04) — mismo criterio que el resto de
-- listar_eventos_auditoria: se agrega una rama UNION ALL más, sin tocar las
-- demás. "Eliminado" es lo único que vale la pena exponer aquí (el cambio de
-- estado_retencion ya es de por sí un evento de bajo riesgo, pero se incluye
-- igual por consistencia con el resto de *_historial ya unidos).
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
