-- Políticas RLS de profiles (US-01.05) + funciones auxiliares de rol
-- reutilizables por el RLS de futuras historias (hogares, hitos, informes sociales, etc.)

alter table public.profiles enable row level security;

-- security definer + stable: evita recursión de RLS al consultar profiles
-- desde dentro de sus propias políticas, y desde políticas de otras tablas.
create or replace function public.current_role()
returns public.rol_usuario
language sql
security definer
stable
set search_path = public
as $$
  select rol
  from public.profiles
  where id = auth.uid()
    and estado = 'activo'
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_role() = 'administrador';
$$;

grant execute on function public.current_role() to authenticated;
grant execute on function public.is_admin() to authenticated;

create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (
  id = auth.uid() or public.is_admin()
);

-- Solo un administrador asigna/cambia rol y estado (US-01.03).
-- No se habilita insert/delete por API: el alta ocurre vía trigger de
-- auth.users (security definer) y no hay borrado de usuarios en el MVP.
create policy "profiles_update_admin_only"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
