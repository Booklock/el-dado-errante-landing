-- Storage bucket para imágenes de juegos
-- Ejecutar en Supabase → SQL Editor

-- Crear bucket público para imágenes de juegos
INSERT INTO storage.buckets (id, name, public)
VALUES ('game-images', 'game-images', true)
ON CONFLICT (id) DO NOTHING;

-- Política: cualquiera puede ver las imágenes (lectura pública)
CREATE POLICY "Public read game images"
ON storage.objects FOR SELECT
USING (bucket_id = 'game-images');

-- Política: solo admins pueden subir imágenes
CREATE POLICY "Admin upload game images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'game-images'
  AND EXISTS (
    SELECT 1 FROM public.clients
    WHERE auth_user_id = auth.uid() AND is_admin = true
  )
);

-- Política: solo admins pueden eliminar imágenes
CREATE POLICY "Admin delete game images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'game-images'
  AND EXISTS (
    SELECT 1 FROM public.clients
    WHERE auth_user_id = auth.uid() AND is_admin = true
  )
);
