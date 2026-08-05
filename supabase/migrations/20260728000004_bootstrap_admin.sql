-- Bootstrap del primer administrador (US-01.03).
-- El trigger handle_new_user() deja rol=NULL para todo usuario nuevo, y la
-- política profiles_update_admin_only exige ya ser admin para cambiar rol
-- (chicken-and-egg). Esta función cierra ese caso solo para un email fijo,
-- conocido de antemano, y no requiere que el usuario ya exista en auth.users.
create or replace function public.bootstrap_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email = 'llucerob@gmail.com' then
    new.rol := 'administrador';
    new.estado := 'activo';
  end if;
  return new;
end;
$$;

create trigger bootstrap_admin_on_profile_insert
before insert on public.profiles
for each row
execute function public.bootstrap_admin();
