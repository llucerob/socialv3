-- EPIC 14 — US-14.04: registrar pago de un reembolso médico aprobado. Un
-- pago por solicitud (unique en solicitud_id), sin update/delete: es un
-- hecho histórico, igual criterio que decisiones_solicitud/evaluaciones_sociales.
-- Misma tabla servirá para los reembolsos excepcionales de 🆕 EPIC 25
-- (US-25.06 "análogos a US-14.04") cuando se implemente, sin duplicar esquema.
create table public.pagos_reembolso (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null unique references public.solicitudes (id),
  fecha_pago date not null,
  monto_pagado numeric(12, 2) not null check (monto_pagado >= 0),
  medio_pago text not null check (length(trim(medio_pago)) > 0),
  observacion text,
  registrado_por uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);

create index pagos_reembolso_solicitud_id_idx on public.pagos_reembolso (solicitud_id);

-- "El monto pagado no puede superar el monto aprobado" (US-14.04): garantía
-- de base de datos, no solo de la Server Action — mismo criterio que la
-- verificación de stock suficiente de movimientos_stock (EPIC 11), porque es
-- una regla numérica de negocio que cruza otra tabla (decisiones_solicitud).
create or replace function public.validar_monto_pago_reembolso()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_monto_aprobado numeric(12, 2);
begin
  select monto_aprobado into v_monto_aprobado
  from public.decisiones_solicitud
  where solicitud_id = new.solicitud_id
    and decision = 'aprobada';

  if v_monto_aprobado is null then
    raise exception 'La solicitud no tiene un monto aprobado registrado.';
  end if;

  if new.monto_pagado > v_monto_aprobado then
    raise exception 'El monto pagado no puede superar el monto aprobado (%).', v_monto_aprobado;
  end if;

  return new;
end;
$$;

create trigger trg_validar_monto_pago_reembolso
before insert on public.pagos_reembolso
for each row
execute function public.validar_monto_pago_reembolso();
