-- MR-06 — Dos modalidades de entrega: en local y a domicilio.
--
-- Hasta ahora toda entrega se trataba como entrega a domicilio (bodega la
-- crea, la asigna a terreno y terreno registra el resultado). Para cajas de
-- mercadería y pañales existe además la entrega en local: la persona retira
-- la ayuda en el Departamento Social y quien la atiende (gestor social o
-- bodega) la registra en el momento.
--
-- 1. `entregas.modalidad`: las filas existentes quedan 'domicilio' (pasaron
--    por ese flujo).
-- 2. `tipos_ayuda.permite_entrega_local`: regla del catálogo. Materiales de
--    construcción queda en false (maestro §13: exclusivamente a domicilio).
-- 3. `registrar_entrega_local()`: security definer, porque el gestor social
--    no tiene permisos sobre `entregas` (RLS de EPIC 12) y no se le abren en
--    general; la función valida rol, estado de la solicitud, regla del tipo
--    de ayuda y que la entrega no esté ya realizada.
-- 4. Las funciones de lectura para otros roles devuelven la modalidad.

-- 1. Modalidad de la entrega -------------------------------------------------

create type public.modalidad_entrega as enum ('domicilio', 'local');

alter table public.entregas
  add column modalidad public.modalidad_entrega not null default 'domicilio';

-- 2. Regla del catálogo ------------------------------------------------------

alter table public.tipos_ayuda
  add column permite_entrega_local boolean not null default false;

update public.tipos_ayuda
set permite_entrega_local = true
where nombre in ('Caja de mercadería', 'Pañales de adulto');

-- La nueva regla se audita igual que las demás (US-06.02).
create or replace function public.log_tipo_ayuda_cambio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  campo text;
begin
  foreach campo in array array[
    'nombre', 'descripcion', 'tipo', 'estado',
    'requiere_aprobacion', 'requiere_entrega', 'requiere_evidencia',
    'requiere_persona_beneficiaria', 'requiere_documentos',
    'tiene_tope_monetario', 'tope_monetario', 'periodicidad',
    'permite_entrega_local'
  ]
  loop
    if to_jsonb(new) ->> campo is distinct from to_jsonb(old) ->> campo then
      insert into public.tipos_ayuda_historial (tipo_ayuda_id, campo, valor_anterior, valor_nuevo, usuario_id)
      values (new.id, campo, to_jsonb(old) ->> campo, to_jsonb(new) ->> campo, auth.uid());
    end if;
  end loop;

  return new;
end;
$$;

-- El cambio de modalidad (domicilio pendiente/fallida → retiro en local)
-- queda en el historial de la entrega.
create or replace function public.log_entrega_cambio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  campo text;
  valor_anterior text;
  valor_nuevo text;
begin
  foreach campo in array array[
    'estado', 'responsable_id', 'fecha_programada', 'motivo_fallo', 'orden_ruta', 'modalidad'
  ]
  loop
    if to_jsonb(new) ->> campo is distinct from to_jsonb(old) ->> campo then
      if campo = 'motivo_fallo' then
        select nombre into valor_anterior from public.motivos_entrega_fallida where id = old.motivo_fallo;
        select nombre into valor_nuevo from public.motivos_entrega_fallida where id = new.motivo_fallo;
      else
        valor_anterior := to_jsonb(old) ->> campo;
        valor_nuevo := to_jsonb(new) ->> campo;
      end if;

      insert into public.entregas_historial (entrega_id, campo, valor_anterior, valor_nuevo, usuario_id)
      values (new.id, campo, valor_anterior, valor_nuevo, auth.uid());
    end if;
  end loop;

  return new;
end;
$$;

-- 3. Registrar una entrega en local -------------------------------------------

-- Errores con prefijo fijo para que la Server Action los traduzca a un
-- mensaje (mismo patrón que STOCK_INSUFICIENTE en movimientos_stock).
create or replace function public.registrar_entrega_local(
  p_solicitud_id uuid,
  p_fecha_hora timestamptz,
  p_receptor_nombre text,
  p_receptor_relacion text,
  p_observacion text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado_solicitud text;
  v_requiere_entrega boolean;
  v_permite_local boolean;
  v_entrega public.entregas%rowtype;
  v_entrega_id uuid;
begin
  if not public.tiene_rol(array['administrador', 'evaluador_social', 'bodega_logistica']::public.rol_usuario[]) then
    raise exception 'No autorizado';
  end if;

  if coalesce(btrim(p_receptor_nombre), '') = '' then
    raise exception 'RECEPTOR_OBLIGATORIO';
  end if;

  select s.estado::text, ta.requiere_entrega, ta.permite_entrega_local
  into v_estado_solicitud, v_requiere_entrega, v_permite_local
  from public.solicitudes s
  join public.tipos_ayuda ta on ta.id = s.tipo_ayuda_id
  where s.id = p_solicitud_id
  for update of s;

  if not found then
    raise exception 'SOLICITUD_NO_ENCONTRADA';
  end if;

  select * into v_entrega
  from public.entregas
  where solicitud_id = p_solicitud_id
  for update;

  -- Antes que el estado de la solicitud: una solicitud ya entregada deja de
  -- estar "aprobada", y el motivo real del rechazo es la entrega hecha.
  if found and v_entrega.estado = 'realizada' then
    raise exception 'ENTREGA_YA_REALIZADA';
  end if;
  if v_estado_solicitud not in ('aprobada', 'aprobada_excepcion') then
    raise exception 'SOLICITUD_NO_APROBADA';
  end if;
  if not (v_requiere_entrega and v_permite_local) then
    raise exception 'NO_PERMITE_ENTREGA_LOCAL';
  end if;

  if v_entrega.id is not null then
    -- Entrega a domicilio pendiente o fallida: la persona vino a retirarla.
    -- Se reutiliza la misma fila (una entrega por solicitud) y el trigger
    -- deja en el historial el cambio de modalidad, estado y responsable.
    update public.entregas
    set modalidad = 'local',
        estado = 'realizada',
        responsable_id = auth.uid(),
        fecha_hora_entrega = coalesce(p_fecha_hora, now()),
        capturado_en = now(),
        receptor_nombre = btrim(p_receptor_nombre),
        receptor_relacion = nullif(btrim(p_receptor_relacion), ''),
        observacion_entrega = nullif(btrim(p_observacion), ''),
        latitud = null,
        longitud = null
    where id = v_entrega.id;

    v_entrega_id := v_entrega.id;
  else
    insert into public.entregas (
      solicitud_id, modalidad, estado, fecha_programada, responsable_id,
      fecha_hora_entrega, capturado_en, receptor_nombre, receptor_relacion, observacion_entrega
    )
    values (
      p_solicitud_id, 'local', 'realizada',
      (coalesce(p_fecha_hora, now()) at time zone 'America/Santiago')::date,
      auth.uid(),
      coalesce(p_fecha_hora, now()), now(),
      btrim(p_receptor_nombre),
      nullif(btrim(p_receptor_relacion), ''),
      nullif(btrim(p_observacion), '')
    )
    returning id into v_entrega_id;

    -- El trigger de historial solo registra updates; la creación de una
    -- entrega en local se deja explícita.
    insert into public.entregas_historial (entrega_id, campo, valor_anterior, valor_nuevo, usuario_id)
    values
      (v_entrega_id, 'modalidad', null, 'local', auth.uid()),
      (v_entrega_id, 'estado', null, 'realizada', auth.uid());
  end if;

  update public.solicitudes
  set estado = 'entregada_pagada'
  where id = p_solicitud_id
    and estado in ('aprobada', 'aprobada_excepcion');

  return v_entrega_id;
end;
$$;

revoke all on function public.registrar_entrega_local(uuid, timestamptz, text, text, text) from public;
grant execute on function public.registrar_entrega_local(uuid, timestamptz, text, text, text) to authenticated;

-- 4. Lectura para otros roles, con la modalidad --------------------------------

-- Cambia el tipo de retorno: hay que recrearlas.
drop function public.listar_entregas_realizadas_de_hogar(uuid);

create function public.listar_entregas_realizadas_de_hogar(p_grupo_familiar_id uuid)
returns table (
  entrega_id uuid,
  solicitud_id uuid,
  tipo_ayuda_nombre text,
  persona_nombre text,
  modalidad text,
  fecha_hora_entrega timestamptz,
  receptor_nombre text,
  receptor_relacion text,
  observacion_entrega text,
  ruta text
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
    e.id as entrega_id,
    e.solicitud_id,
    ta.nombre as tipo_ayuda_nombre,
    case when p.id is not null then p.nombres || ' ' || p.apellidos else null end as persona_nombre,
    e.modalidad::text,
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

drop function public.obtener_entrega_lectura_de_solicitud(uuid);

create function public.obtener_entrega_lectura_de_solicitud(p_solicitud_id uuid)
returns table (
  entrega_id uuid,
  estado text,
  modalidad text,
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
    e.id as entrega_id,
    e.estado::text,
    e.modalidad::text,
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
