-- =====================================================
-- PASO 1: Agregar columna auth_user_id a clients
-- =====================================================
alter table clients
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

alter table clients
  add column if not exists lat  double precision,
  add column if not exists lng  double precision;

-- =====================================================
-- PASO 2: Políticas RLS para que cada cliente
--         pueda leer y actualizar su propio registro
-- =====================================================

-- Habilitar RLS si no está activado
alter table clients enable row level security;

-- Eliminar políticas anteriores si existen
drop policy if exists "Clients can read own record"   on clients;
drop policy if exists "Clients can update own record" on clients;
drop policy if exists "Admin full access to clients"  on clients;

-- El cliente puede leer su propio registro
create policy "Clients can read own record"
  on clients for select
  using (auth_user_id = auth.uid());

-- El cliente puede actualizar su propio registro
create policy "Clients can update own record"
  on clients for update
  using (auth_user_id = auth.uid());

-- El service role (admin) tiene acceso completo
create policy "Admin full access to clients"
  on clients for all
  using (auth.role() = 'service_role');
