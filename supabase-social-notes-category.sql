-- Run this in your Supabase SQL editor
-- Adds the category column to social_notes for the 3-column ideas board
ALTER TABLE public.social_notes
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'recurring'
    CHECK (category IN ('recurring', 'video', 'image'));
