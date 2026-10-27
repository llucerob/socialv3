-- Con roles múltiples una misma persona puede ser evaluadora y aprobadora.
-- Decisión 2026-10-27: se permite (el equipo es chico y a veces hay una
-- sola jefatura), pero nunca en silencio: cuando quien decide registró
-- también una evaluación social de la misma solicitud, la decisión queda
-- marcada y el hecho queda en el historial de la solicitud (que también
-- recorre la auditoría, EPIC 16).
--
-- Se calcula con un trigger y no en cada acción de servidor porque hay tres
-- caminos que insertan decisiones (aprobación regular, excepción RSH,
-- excepción de diálisis) más el rechazo; así ninguno queda sin marcar.

alter table public.decisiones_solicitud
  add column decidida_por_quien_evaluo boolean not null default false;

create or replace function public.marcar_decision_misma_persona()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.decidida_por_quien_evaluo := exists (
    select 1
    from public.evaluaciones_sociales es
    where es.solicitud_id = new.solicitud_id
      and es.evaluador_id = new.aprobador_id
  );

  if new.decidida_por_quien_evaluo then
    insert into public.solicitudes_historial (solicitud_id, campo, valor_anterior, valor_nuevo, usuario_id)
    values (new.solicitud_id, 'decision_misma_persona', null,
            'la misma persona evaluó y decidió (' || new.decision::text || ')', new.aprobador_id);
  end if;

  return new;
end;
$$;

create trigger decisiones_solicitud_misma_persona
  before insert on public.decisiones_solicitud
  for each row execute function public.marcar_decision_misma_persona();
