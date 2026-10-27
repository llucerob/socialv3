-- Roles múltiples por usuario.
--
-- El equipo del Departamento Social es chico: la misma persona puede ser a
-- la vez evaluadora y aprobadora, o aprobadora y encargada de bodega. Hasta
-- ahora cada usuario tenía un solo rol (`profiles.rol`) y todos los
-- permisos se preguntaban con `current_role()`, que devuelve ese único rol.
--
-- Cambios:
-- 1. `profiles.roles` (lista) reemplaza a `profiles.rol`. Se migra el rol
--    actual de cada usuario, así que nadie pierde acceso. La auditoría de
--    cambios (log_profile_cambio) y la RLS de profiles (solo administrador
--    edita) ya cubren la asignación.
-- 2. `tiene_rol(array[...])` reemplaza a `current_role()`: basta con que el
--    usuario tenga alguno de los roles que habilitan el permiso. Para las
--    funciones de visibilidad (documentos, informes, entregas) el resultado
--    es la unión de lo que permite cada rol del usuario.
-- 3. Decisión 2026-10-27: el aprobador también lee informes sociales de
--    confidencialidad 'alta' (quien decide una excepción puede leer el
--    informe en que se apoya). 'Alta' sigue oculta para finanzas, bodega,
--    terreno y auditor.
-- 4. Se eliminan `current_role()` y `profiles.rol`. El drop de la función
--    falla si alguna política la sigue usando, lo que sirve de chequeo de
--    que la reescritura quedó completa.
--
-- Las secciones marcadas "GENERADO" se produjeron a partir de pg_policies y
-- pg_get_functiondef con reemplazos mecánicos (current_role() = ANY/IN/=
-- → tiene_rol, IS NOT NULL → tiene_algun_rol); el resto es manual.

-- 1. Datos -------------------------------------------------------------------

alter table public.profiles
  add column roles public.rol_usuario[] not null default '{}';

update public.profiles set roles = array[rol] where rol is not null;

-- 2. Funciones base ----------------------------------------------------------

create or replace function public.tiene_rol(p_roles public.rol_usuario[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select pr.roles && p_roles
     from public.profiles pr
     where pr.id = auth.uid() and pr.estado = 'activo'),
    false
  );
$$;

-- "Usuario sin rol válido no opera" (US-01.02/01.03): equivalente al antiguo
-- current_role() IS NOT NULL.
create or replace function public.tiene_algun_rol()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select cardinality(pr.roles) > 0
     from public.profiles pr
     where pr.id = auth.uid() and pr.estado = 'activo'),
    false
  );
$$;

grant execute on function public.tiene_rol(public.rol_usuario[]) to authenticated;
grant execute on function public.tiene_algun_rol() to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.tiene_rol(array['administrador']::public.rol_usuario[]);
$$;

-- 3. Visibilidad (manual: unión de permisos por rol) -------------------------

create or replace function public.puede_ver_documento(p_tipo public.tipo_documento)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    public.tiene_rol(array['administrador', 'evaluador_social', 'aprobador']::public.rol_usuario[])
    or (
      public.tiene_rol(array['finanzas']::public.rol_usuario[])
      and p_tipo in ('boleta', 'comprobante', 'certificado_medico', 'certificado_dialisis', 'certificado_defuncion')
    )
    or (
      public.tiene_rol(array['bodega_logistica', 'terreno_repartidor', 'auditor_consulta']::public.rol_usuario[])
      and p_tipo not in ('certificado_medico', 'certificado_dialisis', 'certificado_defuncion', 'informe_social', 'rsh')
    );
$$;

create or replace function public.puede_ver_informe_social(
  p_nivel public.nivel_confidencialidad_informe,
  p_creado_por uuid
)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    public.tiene_rol(array['administrador', 'aprobador']::public.rol_usuario[])
    or (
      public.tiene_rol(array['evaluador_social']::public.rol_usuario[])
      and (p_nivel = 'estandar' or p_creado_por = auth.uid())
    );
$$;

-- 4. Funciones que leían profiles.rol directamente ---------------------------

drop function public.listar_usuarios_para_auditoria();

create function public.listar_usuarios_para_auditoria()
returns table(id uuid, nombre text, roles public.rol_usuario[])
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.tiene_rol(array['administrador', 'auditor_consulta']::public.rol_usuario[]) then
    raise exception 'No autorizado';
  end if;

  return query
  select pr.id, pr.nombre, pr.roles
  from public.profiles pr
  order by pr.nombre;
end;
$$;

grant execute on function public.listar_usuarios_para_auditoria() to authenticated;

create or replace function public.listar_funcionarios_terreno()
returns table(id uuid, nombre text)
language sql
stable
security definer
set search_path = public
as $$
  select id, nombre
  from public.profiles
  where 'terreno_repartidor' = any(roles)
    and estado = 'activo'
  order by nombre;
$$;

create or replace function public.bootstrap_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email = 'llucerob@gmail.com' then
    new.roles := array['administrador']::public.rol_usuario[];
    new.estado := 'activo';
  end if;
  return new;
end;
$$;

create or replace function public.log_profile_cambio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  campo text;
begin
  foreach campo in array array['roles', 'estado']
  loop
    if to_jsonb(new) ->> campo is distinct from to_jsonb(old) ->> campo then
      insert into public.profiles_historial (profile_id, campo, valor_anterior, valor_nuevo, usuario_id)
      values (new.id, campo, to_jsonb(old) ->> campo, to_jsonb(new) ->> campo, auth.uid());
    end if;
  end loop;

  return new;
end;
$$;

-- 5. Políticas y funciones que usaban current_role() ------------------------
-- >>> GENERADO: políticas RLS (50)

drop policy "grupos_familiares_select_rol_valido" on public.grupos_familiares;
create policy "grupos_familiares_select_rol_valido" on public.grupos_familiares
  as permissive for select to authenticated
  using ((public.tiene_algun_rol()));

drop policy "grupos_familiares_insert_evaluador_o_admin" on public.grupos_familiares;
create policy "grupos_familiares_insert_evaluador_o_admin" on public.grupos_familiares
  as permissive for insert to authenticated
  with check ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'evaluador_social'::rol_usuario])));

drop policy "grupos_familiares_update_evaluador_o_admin" on public.grupos_familiares;
create policy "grupos_familiares_update_evaluador_o_admin" on public.grupos_familiares
  as permissive for update to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'evaluador_social'::rol_usuario])))
  with check ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'evaluador_social'::rol_usuario])));

drop policy "grupos_familiares_historial_select_evaluador_o_admin" on public.grupos_familiares_historial;
create policy "grupos_familiares_historial_select_evaluador_o_admin" on public.grupos_familiares_historial
  as permissive for select to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'evaluador_social'::rol_usuario])));

drop policy "personas_select_rol_valido" on public.personas;
create policy "personas_select_rol_valido" on public.personas
  as permissive for select to authenticated
  using ((public.tiene_algun_rol()));

drop policy "personas_insert_evaluador_o_admin" on public.personas;
create policy "personas_insert_evaluador_o_admin" on public.personas
  as permissive for insert to authenticated
  with check ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'evaluador_social'::rol_usuario])));

drop policy "personas_update_evaluador_o_admin" on public.personas;
create policy "personas_update_evaluador_o_admin" on public.personas
  as permissive for update to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'evaluador_social'::rol_usuario])))
  with check ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'evaluador_social'::rol_usuario])));

drop policy "documentos_insert_rol_valido" on public.documentos;
create policy "documentos_insert_rol_valido" on public.documentos
  as permissive for insert to authenticated
  with check ((public.tiene_algun_rol()));

drop policy "motivos_entrega_fallida_select_rol_valido" on public.motivos_entrega_fallida;
create policy "motivos_entrega_fallida_select_rol_valido" on public.motivos_entrega_fallida
  as permissive for select to authenticated
  using ((public.tiene_algun_rol()));

drop policy "personas_historial_select_evaluador_o_admin" on public.personas_historial;
create policy "personas_historial_select_evaluador_o_admin" on public.personas_historial
  as permissive for select to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'evaluador_social'::rol_usuario])));

drop policy "tipos_ayuda_select_rol_valido" on public.tipos_ayuda;
create policy "tipos_ayuda_select_rol_valido" on public.tipos_ayuda
  as permissive for select to authenticated
  using ((public.tiene_algun_rol()));

drop policy "solicitudes_select_rol_valido" on public.solicitudes;
create policy "solicitudes_select_rol_valido" on public.solicitudes
  as permissive for select to authenticated
  using ((public.tiene_algun_rol()));

drop policy "solicitudes_insert_evaluador_o_admin" on public.solicitudes;
create policy "solicitudes_insert_evaluador_o_admin" on public.solicitudes
  as permissive for insert to authenticated
  with check ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'evaluador_social'::rol_usuario])));

drop policy "evaluaciones_sociales_select_gestion" on public.evaluaciones_sociales;
create policy "evaluaciones_sociales_select_gestion" on public.evaluaciones_sociales
  as permissive for select to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'evaluador_social'::rol_usuario, 'aprobador'::rol_usuario])));

drop policy "evaluaciones_sociales_insert_evaluador_o_admin" on public.evaluaciones_sociales;
create policy "evaluaciones_sociales_insert_evaluador_o_admin" on public.evaluaciones_sociales
  as permissive for insert to authenticated
  with check ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'evaluador_social'::rol_usuario])));

drop policy "informes_sociales_insert_evaluador_o_admin" on public.informes_sociales;
create policy "informes_sociales_insert_evaluador_o_admin" on public.informes_sociales
  as permissive for insert to authenticated
  with check ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'evaluador_social'::rol_usuario])));

drop policy "solicitudes_update_gestion_o_aprobacion" on public.solicitudes;
create policy "solicitudes_update_gestion_o_aprobacion" on public.solicitudes
  as permissive for update to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'evaluador_social'::rol_usuario, 'aprobador'::rol_usuario])))
  with check ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'evaluador_social'::rol_usuario, 'aprobador'::rol_usuario])));

drop policy "solicitudes_historial_select_gestion" on public.solicitudes_historial;
create policy "solicitudes_historial_select_gestion" on public.solicitudes_historial
  as permissive for select to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'evaluador_social'::rol_usuario, 'aprobador'::rol_usuario])));

drop policy "decisiones_solicitud_insert_aprobador_o_admin" on public.decisiones_solicitud;
create policy "decisiones_solicitud_insert_aprobador_o_admin" on public.decisiones_solicitud
  as permissive for insert to authenticated
  with check ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'aprobador'::rol_usuario])));

drop policy "hitos_select_gestion" on public.hitos;
create policy "hitos_select_gestion" on public.hitos
  as permissive for select to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'evaluador_social'::rol_usuario, 'aprobador'::rol_usuario])));

drop policy "hitos_insert_evaluador_o_admin" on public.hitos;
create policy "hitos_insert_evaluador_o_admin" on public.hitos
  as permissive for insert to authenticated
  with check ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'evaluador_social'::rol_usuario])));

drop policy "hitos_accesos_denegados_select_admin" on public.hitos_accesos_denegados;
create policy "hitos_accesos_denegados_select_admin" on public.hitos_accesos_denegados
  as permissive for select to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario])));

drop policy "documentos_storage_insert_rol_valido" on storage.objects;
create policy "documentos_storage_insert_rol_valido" on storage.objects
  as permissive for insert to authenticated
  with check (((bucket_id = 'documentos'::text) AND (public.tiene_algun_rol())));

drop policy "productos_select_bodega_o_admin" on public.productos;
create policy "productos_select_bodega_o_admin" on public.productos
  as permissive for select to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'bodega_logistica'::rol_usuario])));

drop policy "productos_insert_bodega_o_admin" on public.productos;
create policy "productos_insert_bodega_o_admin" on public.productos
  as permissive for insert to authenticated
  with check ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'bodega_logistica'::rol_usuario])));

drop policy "productos_update_bodega_o_admin" on public.productos;
create policy "productos_update_bodega_o_admin" on public.productos
  as permissive for update to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'bodega_logistica'::rol_usuario])))
  with check ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'bodega_logistica'::rol_usuario])));

drop policy "movimientos_stock_select_bodega_o_admin" on public.movimientos_stock;
create policy "movimientos_stock_select_bodega_o_admin" on public.movimientos_stock
  as permissive for select to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'bodega_logistica'::rol_usuario])));

drop policy "movimientos_stock_insert_bodega_o_admin" on public.movimientos_stock;
create policy "movimientos_stock_insert_bodega_o_admin" on public.movimientos_stock
  as permissive for insert to authenticated
  with check ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'bodega_logistica'::rol_usuario])));

drop policy "entregas_select_bodega_o_admin" on public.entregas;
create policy "entregas_select_bodega_o_admin" on public.entregas
  as permissive for select to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'bodega_logistica'::rol_usuario])));

drop policy "sectores_select_rol_valido" on public.sectores;
create policy "sectores_select_rol_valido" on public.sectores
  as permissive for select to authenticated
  using ((public.tiene_algun_rol()));

drop policy "entregas_select_terreno_propia" on public.entregas;
create policy "entregas_select_terreno_propia" on public.entregas
  as permissive for select to authenticated
  using (((public.tiene_rol(ARRAY['terreno_repartidor'::rol_usuario])) AND (responsable_id = auth.uid())));

drop policy "entregas_insert_bodega_o_admin" on public.entregas;
create policy "entregas_insert_bodega_o_admin" on public.entregas
  as permissive for insert to authenticated
  with check ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'bodega_logistica'::rol_usuario])));

drop policy "entregas_update_bodega_o_admin" on public.entregas;
create policy "entregas_update_bodega_o_admin" on public.entregas
  as permissive for update to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'bodega_logistica'::rol_usuario])))
  with check ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'bodega_logistica'::rol_usuario])));

drop policy "entregas_update_terreno_propia" on public.entregas;
create policy "entregas_update_terreno_propia" on public.entregas
  as permissive for update to authenticated
  using (((public.tiene_rol(ARRAY['terreno_repartidor'::rol_usuario])) AND (responsable_id = auth.uid())))
  with check (((public.tiene_rol(ARRAY['terreno_repartidor'::rol_usuario])) AND (responsable_id = auth.uid())));

drop policy "entregas_historial_select_bodega_o_admin" on public.entregas_historial;
create policy "entregas_historial_select_bodega_o_admin" on public.entregas_historial
  as permissive for select to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'bodega_logistica'::rol_usuario])));

drop policy "configuracion_rutas_select_logistica" on public.configuracion_rutas;
create policy "configuracion_rutas_select_logistica" on public.configuracion_rutas
  as permissive for select to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'bodega_logistica'::rol_usuario])));

drop policy "documentos_update_validacion_gestion" on public.documentos;
create policy "documentos_update_validacion_gestion" on public.documentos
  as permissive for update to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'evaluador_social'::rol_usuario, 'finanzas'::rol_usuario])))
  with check ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'evaluador_social'::rol_usuario, 'finanzas'::rol_usuario])));

drop policy "pagos_reembolso_select_gestion" on public.pagos_reembolso;
create policy "pagos_reembolso_select_gestion" on public.pagos_reembolso
  as permissive for select to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'evaluador_social'::rol_usuario, 'aprobador'::rol_usuario, 'finanzas'::rol_usuario])));

drop policy "pagos_reembolso_insert_finanzas_o_admin" on public.pagos_reembolso;
create policy "pagos_reembolso_insert_finanzas_o_admin" on public.pagos_reembolso
  as permissive for insert to authenticated
  with check ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'finanzas'::rol_usuario])));

drop policy "decisiones_solicitud_select_gestion" on public.decisiones_solicitud;
create policy "decisiones_solicitud_select_gestion" on public.decisiones_solicitud
  as permissive for select to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'evaluador_social'::rol_usuario, 'aprobador'::rol_usuario, 'finanzas'::rol_usuario])));

drop policy "proveedores_select_bodega_o_admin" on public.proveedores;
create policy "proveedores_select_bodega_o_admin" on public.proveedores
  as permissive for select to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'bodega_logistica'::rol_usuario])));

drop policy "proveedores_insert_bodega_o_admin" on public.proveedores;
create policy "proveedores_insert_bodega_o_admin" on public.proveedores
  as permissive for insert to authenticated
  with check ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'bodega_logistica'::rol_usuario])));

drop policy "proveedores_update_bodega_o_admin" on public.proveedores;
create policy "proveedores_update_bodega_o_admin" on public.proveedores
  as permissive for update to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'bodega_logistica'::rol_usuario])))
  with check ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'bodega_logistica'::rol_usuario])));

drop policy "proveedores_historial_select_bodega_o_admin" on public.proveedores_historial;
create policy "proveedores_historial_select_bodega_o_admin" on public.proveedores_historial
  as permissive for select to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'bodega_logistica'::rol_usuario])));

drop policy "compras_select_bodega_o_admin" on public.compras;
create policy "compras_select_bodega_o_admin" on public.compras
  as permissive for select to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'bodega_logistica'::rol_usuario])));

drop policy "compras_insert_bodega_o_admin" on public.compras;
create policy "compras_insert_bodega_o_admin" on public.compras
  as permissive for insert to authenticated
  with check ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'bodega_logistica'::rol_usuario])));

drop policy "incidentes_seguridad_select_admin_o_auditor" on public.incidentes_seguridad;
create policy "incidentes_seguridad_select_admin_o_auditor" on public.incidentes_seguridad
  as permissive for select to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'auditor_consulta'::rol_usuario])));

drop policy "incidentes_seguridad_insert_admin" on public.incidentes_seguridad;
create policy "incidentes_seguridad_insert_admin" on public.incidentes_seguridad
  as permissive for insert to authenticated
  with check ((public.tiene_rol(ARRAY['administrador'::rol_usuario])));

drop policy "incidentes_seguridad_update_admin" on public.incidentes_seguridad;
create policy "incidentes_seguridad_update_admin" on public.incidentes_seguridad
  as permissive for update to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario])))
  with check ((public.tiene_rol(ARRAY['administrador'::rol_usuario])));

drop policy "incidentes_seguridad_historial_select_admin_o_auditor" on public.incidentes_seguridad_historial;
create policy "incidentes_seguridad_historial_select_admin_o_auditor" on public.incidentes_seguridad_historial
  as permissive for select to authenticated
  using ((public.tiene_rol(ARRAY['administrador'::rol_usuario, 'auditor_consulta'::rol_usuario])));

-- >>> GENERADO: funciones (22)

CREATE OR REPLACE FUNCTION public.actualizar_estado_retencion_documento(p_documento_id uuid, p_estado_retencion estado_retencion_documento)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  update public.documentos
  set estado_retencion = p_estado_retencion
  where id = p_documento_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.actualizar_estado_stock_solicitud(p_solicitud_id uuid, p_nuevo_estado estado_solicitud)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.tiene_rol(array['administrador', 'bodega_logistica']::public.rol_usuario[]) then
    raise exception 'No autorizado';
  end if;

  -- Única transición que esta función autoriza: entre 'aprobada'/
  -- 'aprobada_excepcion' y 'pendiente_stock', en cualquier dirección. No es
  -- un mecanismo genérico de cambio de estado de solicitudes.
  if p_nuevo_estado not in ('pendiente_stock', 'aprobada') then
    raise exception 'Transición de estado no permitida desde inventario';
  end if;

  update public.solicitudes
  set estado = p_nuevo_estado
  where id = p_solicitud_id
    and estado in ('aprobada', 'aprobada_excepcion', 'pendiente_stock');
end;
$function$;

CREATE OR REPLACE FUNCTION public.contar_informes_sociales_de_solicitud(p_solicitud_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.tiene_rol(array['administrador', 'evaluador_social', 'aprobador']::public.rol_usuario[]) then
    raise exception 'No autorizado';
  end if;

  return (select count(*)::integer from public.informes_sociales where solicitud_id = p_solicitud_id);
end;
$function$;

CREATE OR REPLACE FUNCTION public.listar_entregas_pendientes_para_dashboard()
 RETURNS TABLE(entrega_id uuid, solicitud_id uuid, tipo_ayuda_nombre text, direccion text, fecha_programada date, ruta text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.tiene_rol(array['administrador', 'bodega_logistica', 'terreno_repartidor', 'auditor_consulta']::public.rol_usuario[]) then
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
    and (public.tiene_rol(array['administrador', 'bodega_logistica', 'auditor_consulta']::public.rol_usuario[]) or e.responsable_id = auth.uid())
  order by e.fecha_programada nulls last, e.created_at;
end;
$function$;

CREATE OR REPLACE FUNCTION public.listar_entregas_realizadas_de_hogar(p_grupo_familiar_id uuid)
 RETURNS TABLE(entrega_id uuid, solicitud_id uuid, tipo_ayuda_nombre text, persona_nombre text, fecha_hora_entrega timestamp with time zone, receptor_nombre text, receptor_relacion text, observacion_entrega text, ruta text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.tiene_rol(array[
    'administrador', 'evaluador_social', 'aprobador', 'bodega_logistica', 'finanzas', 'auditor_consulta'
  ]::public.rol_usuario[]) then
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
$function$;

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

CREATE OR REPLACE FUNCTION public.listar_reembolsos_pendientes_pago_dashboard()
 RETURNS TABLE(solicitud_id uuid, tipo_ayuda_nombre text, direccion text, persona_nombre text, monto_aprobado numeric, ruta text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.tiene_rol(array['administrador', 'finanzas', 'auditor_consulta']::public.rol_usuario[]) then
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
$function$;

CREATE OR REPLACE FUNCTION public.listar_solicitudes_pendientes_aprobacion_dashboard()
 RETURNS TABLE(solicitud_id uuid, tipo_ayuda_nombre text, direccion text, persona_nombre text, fecha_solicitud date, ruta text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.tiene_rol(array['administrador', 'aprobador', 'auditor_consulta']::public.rol_usuario[]) then
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
$function$;

CREATE OR REPLACE FUNCTION public.marcar_solicitud_entregada(p_solicitud_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.tiene_rol(array['administrador', 'bodega_logistica', 'terreno_repartidor']::public.rol_usuario[]) then
    raise exception 'No autorizado';
  end if;

  update public.solicitudes
  set estado = 'entregada_pagada'
  where id = p_solicitud_id
    and estado in ('aprobada', 'aprobada_excepcion');
end;
$function$;

CREATE OR REPLACE FUNCTION public.marcar_solicitud_reembolso_pagada(p_solicitud_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.tiene_rol(array['administrador', 'finanzas']::public.rol_usuario[]) then
    raise exception 'No autorizado';
  end if;

  update public.solicitudes
  set estado = 'entregada_pagada'
  where id = p_solicitud_id
    and estado in ('aprobada', 'aprobada_excepcion');
end;
$function$;

CREATE OR REPLACE FUNCTION public.obtener_entrega_lectura_de_solicitud(p_solicitud_id uuid)
 RETURNS TABLE(entrega_id uuid, estado text, fecha_programada date, responsable_nombre text, fecha_hora_entrega timestamp with time zone, receptor_nombre text, receptor_relacion text, observacion_entrega text, motivo_fallo_nombre text, observacion_fallo text, latitud numeric, longitud numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.tiene_rol(array[
    'administrador', 'evaluador_social', 'aprobador', 'bodega_logistica', 'finanzas', 'auditor_consulta'
  ]::public.rol_usuario[]) then
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
$function$;

CREATE OR REPLACE FUNCTION public.registrar_anulacion_solicitud(p_solicitud_id uuid, p_motivo text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.tiene_rol(array['administrador', 'evaluador_social']::public.rol_usuario[]) then
    raise exception 'No autorizado';
  end if;

  insert into public.solicitudes_historial (solicitud_id, campo, valor_anterior, valor_nuevo, usuario_id)
  values (p_solicitud_id, 'motivo_anulacion', null, p_motivo, auth.uid());
end;
$function$;

CREATE OR REPLACE FUNCTION public.registrar_bloqueo_tope_reembolso(p_solicitud_id uuid, p_motivo text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.tiene_rol(array['administrador', 'aprobador']::public.rol_usuario[]) then
    raise exception 'No autorizado';
  end if;

  insert into public.solicitudes_historial (solicitud_id, campo, valor_anterior, valor_nuevo, usuario_id)
  values (p_solicitud_id, 'tope_reembolso', null, p_motivo, auth.uid());
end;
$function$;

CREATE OR REPLACE FUNCTION public.registrar_conflicto_sync_entrega(p_entrega_id uuid, p_campo text, p_valor_anterior text, p_valor_nuevo text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.tiene_rol(array['terreno_repartidor', 'administrador']::public.rol_usuario[]) then
    raise exception 'No autorizado';
  end if;

  insert into public.entregas_historial (entrega_id, campo, valor_anterior, valor_nuevo, usuario_id)
  values (p_entrega_id, p_campo, p_valor_anterior, p_valor_nuevo, auth.uid());
end;
$function$;

CREATE OR REPLACE FUNCTION public.registrar_observacion_solicitud(p_solicitud_id uuid, p_motivo text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.tiene_rol(array['administrador', 'evaluador_social', 'aprobador']::public.rol_usuario[]) then
    raise exception 'No autorizado';
  end if;

  insert into public.solicitudes_historial (solicitud_id, campo, valor_anterior, valor_nuevo, usuario_id)
  values (p_solicitud_id, 'motivo_observacion', null, p_motivo, auth.uid());
end;
$function$;

CREATE OR REPLACE FUNCTION public.registrar_validacion_rsh_solicitud(p_solicitud_id uuid, p_resultado text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.tiene_rol(array['administrador', 'evaluador_social']::public.rol_usuario[]) then
    raise exception 'No autorizado';
  end if;

  insert into public.solicitudes_historial (solicitud_id, campo, valor_anterior, valor_nuevo, usuario_id)
  values (p_solicitud_id, 'validacion_rsh', null, p_resultado, auth.uid());
end;
$function$;

CREATE OR REPLACE FUNCTION public.reporte_ayudas_entregadas(p_fecha_desde date DEFAULT NULL::date, p_fecha_hasta date DEFAULT NULL::date, p_tipo_ayuda_id uuid DEFAULT NULL::uuid, p_sector text DEFAULT NULL::text, p_limite integer DEFAULT 500)
 RETURNS TABLE(solicitud_id uuid, fecha date, tipo_ayuda_id uuid, tipo_ayuda_nombre text, grupo_familiar_id uuid, sector text, direccion text, persona_nombre text, monto numeric, es_excepcion boolean, ruta text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.tiene_rol(array['administrador', 'auditor_consulta']::public.rol_usuario[]) then
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
$function$;

CREATE OR REPLACE FUNCTION public.reporte_dialisis_mensual(p_anio integer DEFAULT NULL::integer, p_mes integer DEFAULT NULL::integer, p_persona_id uuid DEFAULT NULL::uuid, p_limite integer DEFAULT 500)
 RETURNS TABLE(persona_id uuid, persona_nombre text, grupo_familiar_id uuid, anio integer, mes integer, monto_acumulado numeric, saldo_disponible numeric, tiene_excepcion boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.tiene_rol(array['administrador', 'finanzas', 'auditor_consulta']::public.rol_usuario[]) then
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
$function$;

CREATE OR REPLACE FUNCTION public.reporte_entregas_pendientes_fallidas(p_estado text DEFAULT NULL::text, p_responsable_id uuid DEFAULT NULL::uuid, p_sector text DEFAULT NULL::text, p_limite integer DEFAULT 500)
 RETURNS TABLE(entrega_id uuid, solicitud_id uuid, estado text, fecha_programada date, responsable_id uuid, responsable_nombre text, tipo_ayuda_nombre text, sector text, direccion text, motivo_fallo text, observacion_fallo text, ruta text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.tiene_rol(array['administrador', 'bodega_logistica']::public.rol_usuario[]) then
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
    mf.nombre as motivo_fallo,
    e.observacion_fallo,
    ('/solicitudes/' || e.solicitud_id) as ruta
  from public.entregas e
  join public.solicitudes s on s.id = e.solicitud_id
  join public.tipos_ayuda ta on ta.id = s.tipo_ayuda_id
  join public.grupos_familiares gf on gf.id = s.grupo_familiar_id
  left join public.motivos_entrega_fallida mf on mf.id = e.motivo_fallo
  where e.estado in ('pendiente', 'fallida')
    and (p_estado is null or e.estado::text = p_estado)
    and (p_responsable_id is null or e.responsable_id = p_responsable_id)
    and (p_sector is null or gf.sector = p_sector)
  order by e.fecha_programada nulls last, e.created_at
  limit p_limite;
end;
$function$;

CREATE OR REPLACE FUNCTION public.reporte_hogares_beneficiados(p_fecha_desde date DEFAULT NULL::date, p_fecha_hasta date DEFAULT NULL::date, p_sector text DEFAULT NULL::text, p_limite integer DEFAULT 500)
 RETURNS TABLE(grupo_familiar_id uuid, direccion text, sector text, cantidad_ayudas bigint, fecha_ultima_ayuda date, ruta text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.tiene_rol(array['administrador', 'auditor_consulta']::public.rol_usuario[]) then
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
$function$;

CREATE OR REPLACE FUNCTION public.reporte_reembolsos_excepcionales(p_fecha_desde date DEFAULT NULL::date, p_fecha_hasta date DEFAULT NULL::date, p_tipo_excepcion text DEFAULT NULL::text, p_limite integer DEFAULT 500)
 RETURNS TABLE(solicitud_id uuid, fecha_solicitud date, tipo_excepcion text, tipo_reembolso_nombre text, grupo_familiar_id uuid, direccion text, persona_nombre text, monto_solicitado numeric, monto_aprobado numeric, monto_pagado numeric, estado text, ruta text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.tiene_rol(array['administrador', 'finanzas']::public.rol_usuario[]) then
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
$function$;

CREATE OR REPLACE FUNCTION public.reporte_reembolsos_medicos(p_fecha_desde date DEFAULT NULL::date, p_fecha_hasta date DEFAULT NULL::date, p_tipo_reembolso text DEFAULT NULL::text, p_limite integer DEFAULT 500)
 RETURNS TABLE(solicitud_id uuid, fecha_solicitud date, tipo_reembolso_nombre text, grupo_familiar_id uuid, direccion text, persona_nombre text, monto_solicitado numeric, monto_aprobado numeric, monto_pagado numeric, estado text, es_excepcion boolean, ruta text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.tiene_rol(array['administrador', 'finanzas']::public.rol_usuario[]) then
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
$function$;

-- 5. Retiro del modelo de un solo rol ---------------------------------------

drop function public."current_role"();

alter table public.profiles drop column rol;
