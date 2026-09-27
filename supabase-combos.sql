-- Run this in your Supabase SQL editor
CREATE TABLE public.combos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  price       integer NOT NULL DEFAULT 0,
  items       text[] NOT NULL DEFAULT '{}',
  active      boolean NOT NULL DEFAULT true,
  image_url   text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;

-- Public can read active combos
CREATE POLICY "Public read active combos" ON public.combos
  FOR SELECT USING (active = true);

-- Admins can do anything
CREATE POLICY "Admin full access" ON public.combos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE auth_user_id = auth.uid() AND is_admin = true
    )
  );
