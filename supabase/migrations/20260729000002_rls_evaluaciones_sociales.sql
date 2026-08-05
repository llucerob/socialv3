-- RLS de evaluaciones_sociales (EPIC 08). A diferencia de grupos_familiares/
-- personas/tipos_ayuda/solicitudes (lectura amplia para cualquier rol
-- válido), esto es dato sensible según CLAUDE.md: "Hitos e informes
-- sociales son datos sensibles: requieren RLS restringido a evaluador
-- social/aprobador/administrador. Terreno, bodega y compras nunca acceden a
-- ellos." El fundamento de una evaluación social es exactamente ese tipo de
-- contenido, aunque EPIC 08 no sea EPIC 22/23 — se le aplica la misma regla.
--
-- Sin políticas de update/delete: una evaluación registrada no se edita ni
-- se borra (ver comentario en la migración anterior).

alter table public.evaluaciones_sociales enable row level security;

create policy "evaluaciones_sociales_select_gestion"
on public.evaluaciones_sociales
for select
to authenticated
using (public.current_role() in ('administrador', 'evaluador_social', 'aprobador'));

create policy "evaluaciones_sociales_insert_evaluador_o_admin"
on public.evaluaciones_sociales
for insert
to authenticated
with check (public.current_role() in ('administrador', 'evaluador_social'));

grant select, insert on public.evaluaciones_sociales to authenticated;

-- US-08.03: "Como evaluador o aprobador, quiero observar una solicitud" —
-- aprobador necesita poder transicionar el estado a 'observada', algo que
-- la política original de EPIC 07 no contemplaba (solo evaluador_social/
-- administrador). Se recrea con el rol adicional; el resto de acciones de
-- escritura sobre solicitudes (crear, editar, enviar a evaluación, anular)
-- siguen restringidas a evaluador_social/administrador a nivel de Server
-- Action (requireRole), aunque la fila ahora sea alcanzable por aprobador.
drop policy "solicitudes_update_evaluador_o_admin" on public.solicitudes;

create policy "solicitudes_update_gestion_o_aprobacion"
on public.solicitudes
for update
to authenticated
using (public.current_role() in ('administrador', 'evaluador_social', 'aprobador'))
with check (public.current_role() in ('administrador', 'evaluador_social', 'aprobador'));

-- Mismo criterio para el historial: aprobador debe poder ver el motivo de
-- observación y la validación RSH para decidir en EPIC 09.
drop policy "solicitudes_historial_select_evaluador_o_admin" on public.solicitudes_historial;

create policy "solicitudes_historial_select_gestion"
on public.solicitudes_historial
for select
to authenticated
using (public.current_role() in ('administrador', 'evaluador_social', 'aprobador'));

-- US-08.03: registra el motivo de observación en el historial, incluso
-- cuando el único cambio de columna es "estado" (el trigger genérico ya
-- audita ese cambio; esto agrega el motivo como entrada separada). Mismo
-- patrón que registrar_validacion_rsh_solicitud — security definer con
-- chequeo de rol explícito, porque de lo contrario cualquier autenticado
-- podría llamarla por REST directo.
create or replace function public.registrar_observacion_solicitud(
  p_solicitud_id uuid,
  p_motivo text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_role() not in ('administrador', 'evaluador_social', 'aprobador') then
    raise exception 'No autorizado';
  end if;

  insert into public.solicitudes_historial (solicitud_id, campo, valor_anterior, valor_nuevo, usuario_id)
  values (p_solicitud_id, 'motivo_observacion', null, p_motivo, auth.uid());
end;
$$;

grant execute on function public.registrar_observacion_solicitud(uuid, text) to authenticated;
