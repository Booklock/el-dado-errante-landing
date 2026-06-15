-- =====================================================
-- ADMIN SETUP
-- Correr en Supabase > SQL Editor
-- =====================================================

-- 1. Tabla de admins (solo emails autorizados)
CREATE TABLE IF NOT EXISTS admins (
  email text PRIMARY KEY
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede verificar si es admin
CREATE POLICY "Authenticated users can check admin status"
  ON admins FOR SELECT TO authenticated USING (true);

-- Agregar tu email como admin (cambiá por tu email real)
INSERT INTO admins (email) VALUES ('famontalto25@gmail.com')
  ON CONFLICT DO NOTHING;

-- =====================================================
-- UNIQUE CONSTRAINT: evitar emails duplicados en clients
-- =====================================================

-- Primero limpiar duplicados si los hay (queda el más antiguo)
DELETE FROM clients
WHERE id NOT IN (
  SELECT MIN(id) FROM clients GROUP BY email
);

-- Agregar restricción única
ALTER TABLE clients
  ADD CONSTRAINT clients_email_unique UNIQUE (email);

-- =====================================================
-- FIX TRIGGER: evitar crear cliente duplicado si ya existe
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.clients (auth_user_id, email, name, phone)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (email) DO UPDATE
    SET auth_user_id = EXCLUDED.auth_user_id
    WHERE clients.auth_user_id IS NULL;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
