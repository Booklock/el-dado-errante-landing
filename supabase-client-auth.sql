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

-- =====================================================
-- BACKFILL CORRECTO: vincula clientes existentes
-- por email (ejecutar UNA sola vez)
-- =====================================================

-- Paso 1: vincular clientes existentes a su auth.user por email
UPDATE clients c
SET auth_user_id = u.id
FROM auth.users u
WHERE c.email = u.email
AND c.auth_user_id IS NULL;

-- Paso 2: eliminar duplicados creados por el INSERT anterior
-- (si corriste el backfill incorrecto antes, esto limpia los duplicados)
DELETE FROM clients
WHERE auth_user_id IN (
  SELECT auth_user_id
  FROM clients
  GROUP BY auth_user_id
  HAVING COUNT(*) > 1
)
AND name = split_part(email, '@', 1)
AND phone IS NULL;
