-- =============================================
-- Trigger: crear cliente automático al registrarse
-- Correr en Supabase > SQL Editor > New query
-- =============================================

create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public.clients (auth_user_id, email, name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name',  split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'phone', null)
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- Permitir que clientes vean sus propias reservas
create policy "Cliente ve sus propias reservas"
  on reservations for select
  to authenticated
  using (
    client_id = (select id from clients where auth_user_id = auth.uid())
  );

-- Insertar manualmente el cliente del usuario ya registrado
-- (reemplazá el auth_user_id y email con los tuyos de Supabase > Authentication > Users)
-- insert into clients (auth_user_id, email, name)
-- select id, email, split_part(email, '@', 1) from auth.users
-- where id not in (select auth_user_id from clients where auth_user_id is not null);
