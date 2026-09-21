-- Tabla de reseñas de juegos
-- Ejecutar en Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS public.game_reviews (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id    uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  client_id  uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  rating     smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (game_id, client_id)
);

ALTER TABLE public.game_reviews ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer reseñas
CREATE POLICY "Public read reviews"
ON public.game_reviews FOR SELECT
USING (true);

-- Usuarios autenticados pueden insertar su propia reseña (una por juego)
CREATE POLICY "Insert own review"
ON public.game_reviews FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = client_id AND auth_user_id = auth.uid()
  )
);

-- Usuarios autenticados pueden actualizar su propia reseña
CREATE POLICY "Update own review"
ON public.game_reviews FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = client_id AND auth_user_id = auth.uid()
  )
);

-- Usuarios autenticados pueden eliminar su propia reseña
CREATE POLICY "Delete own review"
ON public.game_reviews FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = client_id AND auth_user_id = auth.uid()
  )
);
