-- 🆕 EPIC 23 — Informes sociales estructurados (US-23.01/US-23.02/US-23.03).
--
-- "En la v1 del backlog esto solo existía como tipo de documento adjunto
-- (documentos.tipo_documento = 'informe_social'); en la v2 se modela como
-- entidad propia" (maestro, sección 27). Esta tabla es ese registro
-- estructurado — no reemplaza el archivo adjunto (que sigue existiendo vía
-- EPIC 10 para la copia firmada/escaneada); son complementarios.
--
-- "Documentos adjuntos" (campo mínimo del backlog) no se modela como una FK
-- nueva hacia `documentos`: agregar una tercera entidad posible ahí rompería
-- el check `documentos_una_entidad_check` (exactamente una de
-- solicitud_id/grupo_familiar_id). En vez de eso se reutiliza el mecanismo
-- ya existente — los documentos con tipo_documento = 'informe_social' del
-- mismo hogar (ya filtrable en la sección "Documentos" de la ficha) — mismo
-- criterio de no duplicar infraestructura ya usado para tipos_ayuda/tipo_documento.
--
-- "Ayuda sugerida" y "categoría"-like campos descriptivos quedan como texto
-- libre (mismo criterio que hitos.categoria): no hay catálogo cerrado
-- definido en el maestro para esto.
create type public.nivel_confidencialidad_informe as enum ('estandar', 'alta');

create table public.informes_sociales (
  id uuid primary key default gen_random_uuid(),
  grupo_familiar_id uuid not null references public.grupos_familiares (id),
  persona_id uuid references public.personas (id),
  -- US-23.01/US-23.03: "el informe se puede asociar a una solicitud, a una
  -- excepción RSH o a un caso especial de reembolso" — las tres son, en la
  -- práctica, la misma solicitud (una excepción RSH y un caso especial de
  -- reembolso son solicitudes que terminan en decisiones_solicitud/estado
  -- 'aprobada_excepcion'), así que una sola FK nullable cubre los tres casos
  -- sin modelar una entidad "caso" separada. Nullable porque un informe
  -- también puede registrarse sin estar atado a una solicitud puntual.
  solicitud_id uuid references public.solicitudes (id),
  fecha_informe date not null,
  motivo text not null,
  evaluacion_social text not null,
  antecedentes_familiares text not null,
  situacion_habitacional text not null,
  situacion_economica text not null,
  situacion_salud text,
  recomendacion_profesional text not null,
  ayuda_sugerida text,
  -- US-23.01: "el nivel de confidencialidad es obligatorio y determina qué
  -- roles pueden verlo" — por eso es un enum cerrado (no texto libre como
  -- hitos.categoria): la RLS necesita poder distinguir programáticamente
  -- entre los dos casos, ver puede_ver_informe_social() más abajo.
  nivel_confidencialidad public.nivel_confidencialidad_informe not null,
  observaciones text,
  creado_por uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);

create index informes_sociales_grupo_familiar_id_idx on public.informes_sociales (grupo_familiar_id);
create index informes_sociales_solicitud_id_idx on public.informes_sociales (solicitud_id);

-- US-23.02: "acceso restringido según nivel de confidencialidad y rol".
-- Mismo público base que hitos/evaluaciones_sociales (CLAUDE.md: "requieren
-- RLS restringido a evaluador social/aprobador/administrador"), pero
-- 'alta' confidencialidad se restringe más allá de ese grupo: ni siquiera
-- aprobador la ve (solo administrador y el propio autor). Esto es una
-- decisión deliberada, no arbitraria: cuando un informe sí sirve para
-- justificar una excepción que aprobador debe decidir (US-05.05), el
-- asistente social debe marcarlo 'estandar' para que aprobador pueda
-- leerlo — 'alta' es para informes cuyo contenido no es necesario para
-- ninguna decisión de aprobador (ej. antecedentes familiares delicados sin
-- relación con el caso en curso).
create or replace function public.puede_ver_informe_social(
  p_nivel public.nivel_confidencialidad_informe,
  p_creado_por uuid
)
returns boolean
language sql
stable
set search_path = public
as $$
  select case
    when public.current_role() = 'administrador' then true
    when public.current_role() = 'evaluador_social' then p_nivel = 'estandar' or p_creado_por = auth.uid()
    when public.current_role() = 'aprobador' then p_nivel = 'estandar'
    else false
  end;
$$;

grant execute on function public.puede_ver_informe_social(public.nivel_confidencialidad_informe, uuid) to authenticated;

alter table public.informes_sociales enable row level security;

create policy "informes_sociales_select_segun_confidencialidad"
on public.informes_sociales
for select
to authenticated
using (public.puede_ver_informe_social(nivel_confidencialidad, creado_por));

-- "Como asistente social, quiero registrar..." — mismo criterio de escritura
-- que hitos (ROLES_REGISTRAR_HITOS): evaluador_social y administrador,
-- nunca aprobador (que solo lee, para decidir).
create policy "informes_sociales_insert_evaluador_o_admin"
on public.informes_sociales
for insert
to authenticated
with check (public.current_role() in ('administrador', 'evaluador_social'));

grant select, insert on public.informes_sociales to authenticated;

-- Sin update/delete: un informe social es un registro histórico, igual
-- criterio que evaluaciones_sociales/hitos/decisiones_solicitud (hechos que
-- no se editan retroactivamente).
