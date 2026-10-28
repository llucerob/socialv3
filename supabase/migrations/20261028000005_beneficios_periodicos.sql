-- MR-08 — La aprobación otorga un beneficio periódico vigente hasta diciembre.
--
-- Hasta ahora cada solicitud aprobada generaba una sola entrega
-- (entregas.solicitud_id era unique) y tipos_ayuda.periodicidad era un texto
-- descriptivo. Para Caja de mercadería y Pañales de adulto la evaluación
-- decide si el hogar accede a un beneficio que se entrega cada período
-- (mensual, mes por medio o semestral) desde el mes de aprobación hasta el
-- 31 de diciembre de ese año. En enero vence: el hogar necesita una
-- solicitud y una evaluación nuevas.
--
-- 1. Catálogo: tipos_ayuda.periodicidad_beneficio (null = ayuda única). El
--    texto libre `periodicidad` se mantiene como descripción (reembolsos).
-- 2. Evaluación: el gestor social propone la periodicidad.
-- 3. Decisión: el aprobador la confirma, junto con la modalidad de entrega
--    (por defecto a domicilio).
-- 4. `beneficios`: una fila por solicitud aprobada con beneficio periódico.
--    Cuelga del hogar (grupo_familiar_id), como toda ayuda. Se crea sola
--    cuando la solicitud pasa de 'en_evaluacion' a aprobada.
-- 5. Entregas y salidas de stock por período (`periodo` = primer día del
--    mes). Una ayuda única sigue con periodo null y una sola entrega.
-- 6. Funciones: períodos de un beneficio, cambio de modalidad y suspensión
--    (con motivo), lecturas para la solicitud, la ficha del hogar y bodega.
-- 7. Estado de la solicitud: sigue aprobada mientras el beneficio esté en
--    curso; pasa a 'entregada_pagada' con el último período entregado.
-- 8. Reportes: cada entrega realizada de un beneficio es una ayuda
--    entregada, y la excepción RSH no se pierde al entregar.
--
-- Las solicitudes migradas del sistema anterior (origen = 'migracion')
-- quedan como ayudas únicas: no se les exige periodicidad ni se les crea
-- beneficio, y sus entregas históricas no cambian.

-- 1. Catálogo -------------------------------------------------------------------

create type public.periodicidad_beneficio as enum ('mensual', 'mes_por_medio', 'semestral');

alter table public.tipos_ayuda
  add column periodicidad_beneficio public.periodicidad_beneficio,
  add constraint tipos_ayuda_beneficio_periodico_requiere_entrega
    check (periodicidad_beneficio is null or requiere_entrega);

comment on column public.tipos_ayuda.periodicidad_beneficio is
  'MR-08: periodicidad sugerida al aprobar. Null = ayuda única (una sola entrega).';

update public.tipos_ayuda
set periodicidad_beneficio = 'mensual'
where nombre in ('Caja de mercadería', 'Pañales de adulto');

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
    'permite_entrega_local', 'periodicidad_beneficio'
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

-- 2. Propuesta del gestor social -----------------------------------------------------

alter table public.evaluaciones_sociales
  add column periodicidad_propuesta public.periodicidad_beneficio;

-- 3. Decisión del aprobador ------------------------------------------------------------

-- Las decisiones no se modifican (sin grant de update): la periodicidad y la
-- modalidad aprobadas quedan como constancia. La modalidad vigente vive en
-- `beneficios`, que sí puede cambiar (con motivo).
alter table public.decisiones_solicitud
  add column periodicidad public.periodicidad_beneficio,
  add column modalidad_entrega public.modalidad_entrega;

create or replace function public.validar_beneficio_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_periodicidad_tipo public.periodicidad_beneficio;
  v_permite_local boolean;
  v_origen text;
begin
  select ta.periodicidad_beneficio, ta.requiere_entrega and ta.permite_entrega_local, s.origen
  into v_periodicidad_tipo, v_permite_local, v_origen
  from public.solicitudes s
  join public.tipos_ayuda ta on ta.id = s.tipo_ayuda_id
  where s.id = new.solicitud_id;

  -- Rechazo, ayuda única o dato migrado: no hay beneficio periódico.
  if new.decision <> 'aprobada' or v_periodicidad_tipo is null or v_origen = 'migracion' then
    new.periodicidad := null;
    new.modalidad_entrega := null;
    return new;
  end if;

  if new.periodicidad is null then
    raise exception 'PERIODICIDAD_OBLIGATORIA';
  end if;

  new.modalidad_entrega := coalesce(new.modalidad_entrega, 'domicilio');
  if new.modalidad_entrega = 'local' and not v_permite_local then
    raise exception 'NO_PERMITE_ENTREGA_LOCAL';
  end if;

  return new;
end;
$$;

create trigger decisiones_validar_beneficio
before insert on public.decisiones_solicitud
for each row
execute function public.validar_beneficio_decision();

-- 4. Beneficios -----------------------------------------------------------------------------

create table public.beneficios (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null unique references public.solicitudes (id),
  grupo_familiar_id uuid not null references public.grupos_familiares (id),
  periodicidad public.periodicidad_beneficio not null,
  modalidad public.modalidad_entrega not null default 'domicilio',
  -- Primer día del mes de aprobación y 31 de diciembre de ese año.
  vigente_desde date not null,
  vigente_hasta date not null,
  -- CLAUDE.md: "las excepciones nunca se ocultan". El estado de la
  -- solicitud deja de decir 'aprobada_excepcion' al entregarse; esto no.
  es_excepcion boolean not null default false,
  estado text not null default 'vigente' check (estado in ('vigente', 'suspendido')),
  motivo_suspension text,
  suspendido_por uuid references auth.users (id),
  suspendido_en timestamptz,
  creado_por uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint beneficios_vigente_desde_inicio_de_mes check (vigente_desde = date_trunc('month', vigente_desde)::date),
  constraint beneficios_vigencia_en_el_anio check (
    vigente_hasta = make_date(extract(year from vigente_desde)::int, 12, 31)
  ),
  constraint beneficios_suspension_con_motivo check (
    estado <> 'suspendido' or coalesce(btrim(motivo_suspension), '') <> ''
  )
);

create index beneficios_grupo_familiar_id_idx on public.beneficios (grupo_familiar_id);

create table public.beneficios_historial (
  id uuid primary key default gen_random_uuid(),
  beneficio_id uuid not null references public.beneficios (id) on delete cascade,
  campo text not null,
  valor_anterior text,
  valor_nuevo text,
  motivo text,
  usuario_id uuid references auth.users (id),
  creado_en timestamptz not null default now()
);

create index beneficios_historial_beneficio_id_idx on public.beneficios_historial (beneficio_id);

-- Solo lectura directa; los cambios pasan por cambiar_modalidad_beneficio()
-- y suspender_beneficio(), que exigen motivo y lo dejan en el historial.
alter table public.beneficios enable row level security;
alter table public.beneficios_historial enable row level security;

create policy "beneficios_select" on public.beneficios
for select to authenticated
using (public.tiene_rol(array[
  'administrador', 'evaluador_social', 'aprobador', 'bodega_logistica', 'finanzas', 'auditor_consulta'
]::public.rol_usuario[]));

create policy "beneficios_historial_select" on public.beneficios_historial
for select to authenticated
using (public.tiene_rol(array[
  'administrador', 'evaluador_social', 'aprobador', 'bodega_logistica', 'auditor_consulta'
]::public.rol_usuario[]));

grant select on public.beneficios to authenticated;
grant select on public.beneficios_historial to authenticated;

-- Mes en curso en Chile (primer día). Mismo criterio que fechaHoyChile()
-- en la app: después de las 21:00 en Chile, en UTC ya es "mañana".
create or replace function public.mes_actual_chile()
returns date
language sql
stable
as $$
  select date_trunc('month', (now() at time zone 'America/Santiago'))::date;
$$;

grant execute on function public.mes_actual_chile() to authenticated;

-- Los períodos de un beneficio: fuente única del calendario. Septiembre
-- mensual = sep, oct, nov, dic; mes por medio = sep, nov; semestral = sep.
create or replace function public.periodos_beneficio(
  p_desde date,
  p_hasta date,
  p_periodicidad public.periodicidad_beneficio
)
returns setof date
language sql
immutable
as $$
  select g::date
  from generate_series(
    p_desde::timestamp,
    p_hasta::timestamp,
    make_interval(months => case p_periodicidad
      when 'mensual' then 1
      when 'mes_por_medio' then 2
      else 6
    end)
  ) g;
$$;

grant execute on function public.periodos_beneficio(date, date, public.periodicidad_beneficio) to authenticated;

create or replace function public.crear_beneficio_al_aprobar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_decision public.decisiones_solicitud%rowtype;
  v_desde date;
begin
  if new.origen = 'migracion' then
    return new;
  end if;

  select * into v_decision
  from public.decisiones_solicitud
  where solicitud_id = new.id and decision = 'aprobada';

  if not found or v_decision.periodicidad is null then
    return new;
  end if;

  v_desde := date_trunc('month', v_decision.created_at at time zone 'America/Santiago')::date;

  insert into public.beneficios (
    solicitud_id, grupo_familiar_id, periodicidad, modalidad,
    vigente_desde, vigente_hasta, es_excepcion, creado_por
  )
  values (
    new.id, new.grupo_familiar_id, v_decision.periodicidad, v_decision.modalidad_entrega,
    v_desde, make_date(extract(year from v_desde)::int, 12, 31),
    new.estado = 'aprobada_excepcion', v_decision.aprobador_id
  )
  on conflict (solicitud_id) do nothing;

  return new;
end;
$$;

create trigger solicitudes_crear_beneficio
after update of estado on public.solicitudes
for each row
when (old.estado = 'en_evaluacion' and new.estado in ('aprobada', 'aprobada_excepcion'))
execute function public.crear_beneficio_al_aprobar();

-- 5. Entregas y salidas de stock por período -------------------------------------------------

alter table public.entregas
  add column periodo date,
  add constraint entregas_periodo_inicio_de_mes check (periodo is null or periodo = date_trunc('month', periodo)::date);

-- Deja de existir "una entrega por solicitud": una por período. La ayuda
-- única (periodo null) sigue con una sola.
alter table public.entregas drop constraint entregas_solicitud_id_key;
create unique index entregas_solicitud_unica_idx on public.entregas (solicitud_id) where periodo is null;
create unique index entregas_solicitud_periodo_idx on public.entregas (solicitud_id, periodo) where periodo is not null;

alter table public.movimientos_stock
  add column periodo date,
  add constraint movimientos_stock_periodo_inicio_de_mes check (periodo is null or periodo = date_trunc('month', periodo)::date),
  add constraint movimientos_stock_periodo_solo_salida check (periodo is null or tipo = 'salida');

-- Valida el período de una entrega o de una salida de stock contra el
-- beneficio de su solicitud. Errores con prefijo fijo, traducidos en la app.
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

  if p_es_creacion then
    if p_periodo not in (
      select public.periodos_beneficio(v_beneficio.vigente_desde, v_beneficio.vigente_hasta, v_beneficio.periodicidad)
    ) then
      raise exception 'PERIODO_FUERA_DE_BENEFICIO';
    end if;
    if p_periodo > public.mes_actual_chile() then
      raise exception 'PERIODO_FUTURO';
    end if;
    if public.mes_actual_chile() > v_beneficio.vigente_hasta then
      raise exception 'BENEFICIO_VENCIDO';
    end if;
  end if;
end;
$$;

revoke all on function public.validar_periodo_beneficio(uuid, date, boolean) from public, anon, authenticated;

create or replace function public.validar_periodo_entrega()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.periodo is distinct from old.periodo then
    raise exception 'PERIODO_INMUTABLE';
  end if;
  if tg_op = 'UPDATE' and old.estado = 'cancelada' and new.estado <> 'cancelada' then
    raise exception 'BENEFICIO_SUSPENDIDO';
  end if;

  -- Crear, entregar o reprogramar exige un beneficio no suspendido; marcar
  -- fallida o cancelar no.
  if tg_op = 'INSERT' then
    perform public.validar_periodo_beneficio(new.solicitud_id, new.periodo, true);
  elsif new.estado in ('realizada', 'pendiente') and old.estado is distinct from new.estado then
    perform public.validar_periodo_beneficio(new.solicitud_id, new.periodo, false);
  end if;

  return new;
end;
$$;

-- El nombre ordena el trigger antes que entregas_exigir_salida_stock (los
-- triggers BEFORE corren por orden alfabético): un período inválido se
-- informa como tal, no como falta de salida de stock.
create trigger entregas_beneficio_validar_periodo
before insert or update on public.entregas
for each row
execute function public.validar_periodo_entrega();

create or replace function public.validar_periodo_movimiento_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tipo = 'salida' then
    perform public.validar_periodo_beneficio(new.solicitud_id, new.periodo, true);
  end if;
  return new;
end;
$$;

create trigger movimientos_stock_validar_periodo
before insert on public.movimientos_stock
for each row
execute function public.validar_periodo_movimiento_stock();

-- MR-07 por período: la entrega de un período exige la salida de ese período.
create or replace function public.exigir_salida_stock_entrega()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT' or (new.estado = 'realizada' and old.estado is distinct from 'realizada'))
     and not exists (
       select 1 from public.solicitudes s
       where s.id = new.solicitud_id and s.origen = 'migracion'
     )
     and not exists (
       select 1 from public.movimientos_stock m
       where m.tipo = 'salida'
         and m.solicitud_id = new.solicitud_id
         and m.periodo is not distinct from new.periodo
     ) then
    raise exception 'SIN_SALIDA_STOCK';
  end if;

  return new;
end;
$$;

-- Para quien no lee movimientos_stock (gestor social, aprobador, terreno).
-- Con p_periodo null es la ayuda única (y las salidas anteriores a MR-08).
create or replace function public.salida_stock_registrada(p_solicitud_id uuid, p_periodo date default null)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.tiene_algun_rol() then
    raise exception 'No autorizado';
  end if;

  return exists (
    select 1 from public.movimientos_stock m
    where m.tipo = 'salida'
      and m.solicitud_id = p_solicitud_id
      and m.periodo is not distinct from p_periodo
  );
end;
$$;

grant execute on function public.salida_stock_registrada(uuid, date) to authenticated;

-- 7. Estado de la solicitud tras una entrega ------------------------------------------------

-- Ayuda única: entregada con su entrega. Beneficio: con el último período.
create or replace function public.marcar_solicitud_entregada_si_corresponde(p_solicitud_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_beneficio public.beneficios%rowtype;
begin
  select * into v_beneficio from public.beneficios where solicitud_id = p_solicitud_id;

  if found and exists (
    select 1
    from public.periodos_beneficio(v_beneficio.vigente_desde, v_beneficio.vigente_hasta, v_beneficio.periodicidad) p
    where not exists (
      select 1 from public.entregas e
      where e.solicitud_id = p_solicitud_id and e.periodo = p and e.estado = 'realizada'
    )
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

create or replace function public.marcar_solicitud_entregada(p_solicitud_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.tiene_rol(array['administrador', 'bodega_logistica', 'terreno_repartidor']::public.rol_usuario[]) then
    raise exception 'No autorizado';
  end if;

  perform public.marcar_solicitud_entregada_si_corresponde(p_solicitud_id);
end;
$$;

-- MR-06 con período: la entrega en local de un período del beneficio.
drop function public.registrar_entrega_local(uuid, timestamptz, text, text, text);

create function public.registrar_entrega_local(
  p_solicitud_id uuid,
  p_periodo date,
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
    and periodo is not distinct from p_periodo
  for update;

  if found and v_entrega.estado = 'realizada' then
    raise exception 'ENTREGA_YA_REALIZADA';
  end if;
  if v_estado_solicitud not in ('aprobada', 'aprobada_excepcion') then
    raise exception 'SOLICITUD_NO_APROBADA';
  end if;
  -- En un beneficio a domicilio, la persona igual puede venir a retirar la
  -- entrega de un período: lo que cuenta es el tipo de ayuda.
  if not (v_requiere_entrega and v_permite_local) then
    raise exception 'NO_PERMITE_ENTREGA_LOCAL';
  end if;

  if v_entrega.id is not null then
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
      solicitud_id, periodo, modalidad, estado, fecha_programada, responsable_id,
      fecha_hora_entrega, capturado_en, receptor_nombre, receptor_relacion, observacion_entrega
    )
    values (
      p_solicitud_id, p_periodo, 'local', 'realizada',
      (coalesce(p_fecha_hora, now()) at time zone 'America/Santiago')::date,
      auth.uid(),
      coalesce(p_fecha_hora, now()), now(),
      btrim(p_receptor_nombre),
      nullif(btrim(p_receptor_relacion), ''),
      nullif(btrim(p_observacion), '')
    )
    returning id into v_entrega_id;

    insert into public.entregas_historial (entrega_id, campo, valor_anterior, valor_nuevo, usuario_id)
    values
      (v_entrega_id, 'modalidad', null, 'local', auth.uid()),
      (v_entrega_id, 'estado', null, 'realizada', auth.uid());
  end if;

  perform public.marcar_solicitud_entregada_si_corresponde(p_solicitud_id);

  return v_entrega_id;
end;
$$;

revoke all on function public.registrar_entrega_local(uuid, date, timestamptz, text, text, text) from public;
grant execute on function public.registrar_entrega_local(uuid, date, timestamptz, text, text, text) to authenticated;

-- 6. Cambio de modalidad y suspensión -------------------------------------------------------

create or replace function public.cambiar_modalidad_beneficio(
  p_solicitud_id uuid,
  p_modalidad public.modalidad_entrega,
  p_motivo text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_beneficio public.beneficios%rowtype;
  v_permite_local boolean;
begin
  if not public.tiene_rol(array['administrador', 'evaluador_social', 'aprobador']::public.rol_usuario[]) then
    raise exception 'No autorizado';
  end if;
  if coalesce(btrim(p_motivo), '') = '' then
    raise exception 'MOTIVO_OBLIGATORIO';
  end if;

  select * into v_beneficio from public.beneficios where solicitud_id = p_solicitud_id for update;
  if not found then
    raise exception 'BENEFICIO_NO_ENCONTRADO';
  end if;
  if v_beneficio.estado <> 'vigente' or public.mes_actual_chile() > v_beneficio.vigente_hasta then
    raise exception 'BENEFICIO_NO_VIGENTE';
  end if;
  if v_beneficio.modalidad = p_modalidad then
    raise exception 'MODALIDAD_SIN_CAMBIO';
  end if;

  select ta.requiere_entrega and ta.permite_entrega_local into v_permite_local
  from public.solicitudes s
  join public.tipos_ayuda ta on ta.id = s.tipo_ayuda_id
  where s.id = p_solicitud_id;

  if p_modalidad = 'local' and not v_permite_local then
    raise exception 'NO_PERMITE_ENTREGA_LOCAL';
  end if;

  update public.beneficios
  set modalidad = p_modalidad, updated_at = now()
  where id = v_beneficio.id;

  insert into public.beneficios_historial (beneficio_id, campo, valor_anterior, valor_nuevo, motivo, usuario_id)
  values (v_beneficio.id, 'modalidad', v_beneficio.modalidad::text, p_modalidad::text, btrim(p_motivo), auth.uid());
end;
$$;

grant execute on function public.cambiar_modalidad_beneficio(uuid, public.modalidad_entrega, text) to authenticated;

-- Suspender: los períodos pendientes se cancelan, lo entregado se conserva
-- y la solicitud se cierra. El motivo queda en el historial del beneficio y
-- en el de la solicitud.
create or replace function public.suspender_beneficio(p_solicitud_id uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_beneficio public.beneficios%rowtype;
begin
  if not public.tiene_rol(array['administrador', 'evaluador_social', 'aprobador']::public.rol_usuario[]) then
    raise exception 'No autorizado';
  end if;
  if coalesce(btrim(p_motivo), '') = '' then
    raise exception 'MOTIVO_OBLIGATORIO';
  end if;

  select * into v_beneficio from public.beneficios where solicitud_id = p_solicitud_id for update;
  if not found then
    raise exception 'BENEFICIO_NO_ENCONTRADO';
  end if;
  if v_beneficio.estado = 'suspendido' then
    raise exception 'BENEFICIO_YA_SUSPENDIDO';
  end if;

  update public.beneficios
  set estado = 'suspendido',
      motivo_suspension = btrim(p_motivo),
      suspendido_por = auth.uid(),
      suspendido_en = now(),
      updated_at = now()
  where id = v_beneficio.id;

  insert into public.beneficios_historial (beneficio_id, campo, valor_anterior, valor_nuevo, motivo, usuario_id)
  values (v_beneficio.id, 'estado', 'vigente', 'suspendido', btrim(p_motivo), auth.uid());

  update public.entregas
  set estado = 'cancelada'
  where solicitud_id = p_solicitud_id
    and estado in ('pendiente', 'fallida');

  update public.solicitudes
  set estado = 'cerrada'
  where id = p_solicitud_id
    and estado in ('aprobada', 'aprobada_excepcion', 'pendiente_stock');

  insert into public.solicitudes_historial (solicitud_id, campo, valor_anterior, valor_nuevo, usuario_id)
  values (p_solicitud_id, 'motivo_suspension_beneficio', null, btrim(p_motivo), auth.uid());
end;
$$;

grant execute on function public.suspender_beneficio(uuid, text) to authenticated;

-- Lecturas -----------------------------------------------------------------------------------

-- Resumen de los beneficios de un hogar o de una solicitud: ficha del hogar
-- ("Solicitudes y ayudas") y detalle de la solicitud.
create or replace function public.listar_beneficios(
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
  with periodos as (
    select
      b.id as beneficio_id,
      p as periodo,
      exists (
        select 1 from public.entregas e
        where e.solicitud_id = b.solicitud_id and e.periodo = p and e.estado = 'realizada'
      ) as entregado
    from public.beneficios b
    cross join lateral public.periodos_beneficio(b.vigente_desde, b.vigente_hasta, b.periodicidad) p
    where (p_grupo_familiar_id is null or b.grupo_familiar_id = p_grupo_familiar_id)
      and (p_solicitud_id is null or b.solicitud_id = p_solicitud_id)
  ),
  resumen as (
    select
      periodos.beneficio_id,
      count(*)::integer as total,
      count(*) filter (where periodos.entregado)::integer as entregados,
      min(periodos.periodo) filter (where not periodos.entregado) as proximo
    from periodos
    group by periodos.beneficio_id
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
      when r.entregados = r.total then 'completado'
      when public.mes_actual_chile() > b.vigente_hasta then 'vencido'
      else 'vigente'
    end,
    b.es_excepcion,
    b.motivo_suspension,
    r.total,
    r.entregados,
    (select max(e.fecha_hora_entrega) from public.entregas e
     where e.solicitud_id = b.solicitud_id and e.estado = 'realizada'),
    case when b.estado = 'suspendido' then null else r.proximo end
  from public.beneficios b
  join resumen r on r.beneficio_id = b.id
  join public.solicitudes s on s.id = b.solicitud_id
  join public.tipos_ayuda ta on ta.id = s.tipo_ayuda_id
  left join public.personas pe on pe.id = s.persona_id
  order by b.vigente_desde desc, b.created_at desc;
end;
$$;

grant execute on function public.listar_beneficios(uuid, uuid) to authenticated;

-- Cada período de un beneficio, con su entrega y su salida de stock.
create or replace function public.listar_periodos_de_beneficio(p_solicitud_id uuid)
returns table (
  periodo date,
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
    p,
    e.id,
    e.estado::text,
    e.modalidad::text,
    e.fecha_programada,
    e.fecha_hora_entrega,
    public.nombre_usuario(e.responsable_id),
    e.receptor_nombre,
    exists (
      select 1 from public.movimientos_stock m
      where m.tipo = 'salida' and m.solicitud_id = b.solicitud_id and m.periodo = p
    )
  from public.beneficios b
  cross join lateral public.periodos_beneficio(b.vigente_desde, b.vigente_hasta, b.periodicidad) p
  left join public.entregas e on e.solicitud_id = b.solicitud_id and e.periodo = p
  where b.solicitud_id = p_solicitud_id
  order by p;
end;
$$;

grant execute on function public.listar_periodos_de_beneficio(uuid) to authenticated;

-- Bodega: los períodos ya iniciados de beneficios vigentes que aún no se
-- entregan (incluye los atrasados), con su salida de stock.
create or replace function public.listar_periodos_por_preparar()
returns table (
  solicitud_id uuid,
  tipo_ayuda_nombre text,
  direccion text,
  sector text,
  persona_nombre text,
  periodo date,
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
    p,
    b.modalidad::text,
    b.es_excepcion,
    exists (
      select 1 from public.movimientos_stock m
      where m.tipo = 'salida' and m.solicitud_id = b.solicitud_id and m.periodo = p
    ),
    e.estado::text,
    ('/solicitudes/' || b.solicitud_id || '?periodo=' || to_char(p, 'YYYY-MM'))
  from public.beneficios b
  cross join lateral public.periodos_beneficio(b.vigente_desde, b.vigente_hasta, b.periodicidad) p
  join public.solicitudes s on s.id = b.solicitud_id
  join public.tipos_ayuda ta on ta.id = s.tipo_ayuda_id
  join public.grupos_familiares gf on gf.id = b.grupo_familiar_id
  left join public.personas pe on pe.id = s.persona_id
  left join public.entregas e on e.solicitud_id = b.solicitud_id and e.periodo = p
  where b.estado = 'vigente'
    and public.mes_actual_chile() <= b.vigente_hasta
    and p <= public.mes_actual_chile()
    and (e.id is null or e.estado <> 'realizada')
  order by p, gf.sector, gf.direccion;
end;
$$;

grant execute on function public.listar_periodos_por_preparar() to authenticated;

-- Lectura de la entrega de una solicitud (y período) para roles que no
-- gestionan entregas. Cambia la firma: hay que recrearla.
drop function public.obtener_entrega_lectura_de_solicitud(uuid);

create function public.obtener_entrega_lectura_de_solicitud(p_solicitud_id uuid, p_periodo date default null)
returns table (
  entrega_id uuid,
  periodo date,
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
    e.periodo,
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
  where e.solicitud_id = p_solicitud_id
    and e.periodo is not distinct from p_periodo;
end;
$$;

grant execute on function public.obtener_entrega_lectura_de_solicitud(uuid, date) to authenticated;

drop function public.listar_entregas_realizadas_de_hogar(uuid);

create function public.listar_entregas_realizadas_de_hogar(p_grupo_familiar_id uuid)
returns table (
  entrega_id uuid,
  solicitud_id uuid,
  tipo_ayuda_nombre text,
  persona_nombre text,
  modalidad text,
  periodo date,
  es_excepcion boolean,
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
    e.periodo,
    (s.estado = 'aprobada_excepcion' or coalesce(b.es_excepcion, false)) as es_excepcion,
    e.fecha_hora_entrega,
    e.receptor_nombre,
    e.receptor_relacion,
    e.observacion_entrega,
    ('/solicitudes/' || e.solicitud_id
      || case when e.periodo is not null then '?periodo=' || to_char(e.periodo, 'YYYY-MM') else '' end) as ruta
  from public.entregas e
  join public.solicitudes s on s.id = e.solicitud_id
  join public.tipos_ayuda ta on ta.id = s.tipo_ayuda_id
  left join public.personas p on p.id = s.persona_id
  left join public.beneficios b on b.solicitud_id = e.solicitud_id
  where s.grupo_familiar_id = p_grupo_familiar_id
    and e.estado = 'realizada'
  order by e.fecha_hora_entrega desc nulls last;
end;
$$;

grant execute on function public.listar_entregas_realizadas_de_hogar(uuid) to authenticated;

-- 8. Reportes ---------------------------------------------------------------------------------

-- US-17.01: una ayuda entregada es cada entrega realizada o cada reembolso
-- pagado. Una ayuda única sigue contando una vez (su solicitud pasa a
-- 'entregada_pagada'); un beneficio cuenta una vez por período entregado,
-- aunque el beneficio siga en curso.
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
stable
security definer
set search_path = public
as $$
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
      (s.estado = 'aprobada_excepcion' or coalesce(b.es_excepcion, false)) as es_excepcion,
      ('/solicitudes/' || s.id) as ruta
    from public.solicitudes s
    join public.tipos_ayuda ta on ta.id = s.tipo_ayuda_id
    join public.grupos_familiares gf on gf.id = s.grupo_familiar_id
    left join public.personas p on p.id = s.persona_id
    left join public.beneficios b on b.solicitud_id = s.id
    left join public.entregas e
      on e.solicitud_id = s.id
      and (b.id is null or e.estado = 'realizada')
    left join public.pagos_reembolso pr on pr.solicitud_id = s.id
    left join public.decisiones_solicitud ds on ds.solicitud_id = s.id and ds.decision = 'aprobada'
    where (b.id is null and s.estado = 'entregada_pagada')
       or (b.id is not null and e.id is not null)
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
stable
security definer
set search_path = public
as $$
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
    left join public.beneficios b on b.solicitud_id = s.id
    left join public.entregas e
      on e.solicitud_id = s.id
      and (b.id is null or e.estado = 'realizada')
    left join public.pagos_reembolso pr on pr.solicitud_id = s.id
    where (b.id is null and s.estado = 'entregada_pagada')
       or (b.id is not null and e.id is not null)
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
