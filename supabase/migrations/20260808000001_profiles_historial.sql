-- US-19.01 — Administrar usuarios.
-- "Se listan usuarios / se puede cambiar rol / se puede activar o
-- desactivar usuario" ya están cubiertos por la RLS existente de `profiles`
-- (20260728000003_rls_profiles.sql): `profiles_select_own_or_admin` deja a
-- administrador leer cualquier fila (no solo la propia, porque `is_admin()`
-- no depende de la fila evaluada) y `profiles_update_admin_only` deja a
-- administrador actualizar cualquier columna de cualquier fila — no hace
-- falta ninguna política nueva para el CRUD en sí.
--
-- Lo único que falta es "los cambios quedan auditados": a diferencia de
-- grupos_familiares/personas/tipos_ayuda/entregas, `profiles` nunca tuvo su
-- propia tabla de historial. Mismo patrón genérico que esas tablas.
create table public.profiles_historial (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  campo text not null,
  valor_anterior text,
  valor_nuevo text,
  usuario_id uuid references auth.users (id),
  creado_en timestamptz not null default now()
);

create index profiles_historial_profile_id_idx on public.profiles_historial (profile_id);

create or replace function public.log_profile_cambio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  campo text;
begin
  foreach campo in array array['rol', 'estado']
  loop
    if to_jsonb(new) ->> campo is distinct from to_jsonb(old) ->> campo then
      insert into public.profiles_historial (profile_id, campo, valor_anterior, valor_nuevo, usuario_id)
      values (new.id, campo, to_jsonb(old) ->> campo, to_jsonb(new) ->> campo, auth.uid());
    end if;
  end loop;

  return new;
end;
$$;

create trigger profiles_audit_cambios
after update on public.profiles
for each row
execute function public.log_profile_cambio();

-- Mismo público que gestiona (administrador) — igual criterio que
-- tipos_ayuda_historial/grupos_familiares_historial.
alter table public.profiles_historial enable row level security;

create policy "profiles_historial_select_admin"
on public.profiles_historial
for select
to authenticated
using (public.is_admin());

grant select on public.profiles_historial to authenticated;
