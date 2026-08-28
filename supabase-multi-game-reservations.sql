-- Soporte de múltiples juegos por reserva + precio editable
-- Ejecutar en Supabase → SQL Editor

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS game_ids    uuid[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS total_price numeric;
