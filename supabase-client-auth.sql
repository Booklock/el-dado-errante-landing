-- =============================================
-- Vincular clientes con Supabase Auth
-- Correr en Supabase > SQL Editor > New query
-- =============================================

alter table clients
  add column if not exists auth_user_id uuid unique references auth.users(id);

create index if not exists clients_auth_user_idx on clients(auth_user_id);

-- El cliente autenticado puede ver y editar solo su propio perfil
create policy "Cliente lee su propio perfil"
  on clients for select
  to authenticated
  using (auth_user_id = auth.uid());

create policy "Cliente actualiza su propio perfil"
  on clients for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());
