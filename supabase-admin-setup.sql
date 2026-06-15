-- =====================================================
-- ADMIN SETUP — Correr en Supabase > SQL Editor
-- =====================================================

-- 1. Unique constraint en clients.email (evita duplicados)
--    Primero limpia duplicados si los hay
DELETE FROM clients
WHERE id NOT IN (
  SELECT MIN(id) FROM clients GROUP BY email
);

ALTER TABLE clients
  ADD CONSTRAINT clients_email_unique UNIQUE (email);

-- 2. Trigger mejorado: si el email ya existe, vincula en vez de crear duplicado
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
