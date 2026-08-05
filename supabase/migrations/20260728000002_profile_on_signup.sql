-- Crea automáticamente el perfil al registrarse un usuario en Supabase Auth (US-01.02)
-- security definer: el trigger sobre auth.users debe poder escribir en public.profiles
-- sin depender de los grants/RLS del rol que dispara el insert.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', new.email),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
