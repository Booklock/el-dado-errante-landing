-- Run this in your Supabase SQL editor
CREATE TABLE public.content_calendar (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text NOT NULL,
  platform       text NOT NULL DEFAULT 'instagram',
  content        text,
  scheduled_date date NOT NULL,
  published      boolean NOT NULL DEFAULT false,
  published_at   timestamptz,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin content_calendar" ON public.content_calendar
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.clients WHERE auth_user_id = auth.uid() AND is_admin = true)
  );
