-- Trigger actualizado: vincula clientes temporales al registrarse
-- Busca por email primero, luego por teléfono (para clientes sin email)
-- Ejecutar en Supabase → SQL Editor

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  phone_clean text;
BEGIN
  phone_clean := regexp_replace(COALESCE(NEW.raw_user_meta_data->>'phone', ''), '\D', '', 'g');

  -- 1. Intentar vincular por email
  UPDATE clients
  SET auth_user_id = NEW.id
  WHERE email = NEW.email
    AND auth_user_id IS NULL;

  -- 2. Si no hubo match por email, intentar por teléfono
  IF NOT FOUND AND phone_clean != '' THEN
    UPDATE clients
    SET auth_user_id = NEW.id,
        email        = COALESCE(email, NEW.email)
    WHERE id = (
      SELECT id FROM clients
      WHERE regexp_replace(COALESCE(phone, ''), '\D', '', 'g') = phone_clean
        AND auth_user_id IS NULL
      LIMIT 1
    );
  END IF;

  -- 3. Si no encontró ningún cliente temporal, crear uno nuevo
  IF NOT FOUND THEN
    INSERT INTO clients (auth_user_id, name, email, phone)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      NEW.email,
      NULLIF(NEW.raw_user_meta_data->>'phone', '')
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Verificar que el trigger sigue activo (no necesita recrearse si ya existe)
-- SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';
