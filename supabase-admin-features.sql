-- Run this in your Supabase SQL editor
-- ─── Lista de compras ────────────────────────────────────────────────────────
CREATE TABLE public.buy_list (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_name   text NOT NULL,
  notes       text,
  status      text NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','bought','discarded')),
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE public.buy_list_vendors (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buy_list_id uuid NOT NULL REFERENCES public.buy_list(id) ON DELETE CASCADE,
  vendor_name text NOT NULL,
  price       integer,
  url         text,
  notes       text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.buy_list         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buy_list_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin buy_list" ON public.buy_list
  FOR ALL USING (EXISTS (SELECT 1 FROM public.clients WHERE auth_user_id = auth.uid() AND is_admin = true));
CREATE POLICY "Admin buy_list_vendors" ON public.buy_list_vendors
  FOR ALL USING (EXISTS (SELECT 1 FROM public.clients WHERE auth_user_id = auth.uid() AND is_admin = true));

-- ─── Notas de redes sociales ──────────────────────────────────────────────────
CREATE TABLE public.social_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  type        text NOT NULL DEFAULT 'note' CHECK (type IN ('note','checklist')),
  content     text,
  items       jsonb DEFAULT '[]'::jsonb,    -- [{text, done}]
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.social_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin social_notes" ON public.social_notes
  FOR ALL USING (EXISTS (SELECT 1 FROM public.clients WHERE auth_user_id = auth.uid() AND is_admin = true));

-- ─── Giveaways ────────────────────────────────────────────────────────────────
CREATE TABLE public.giveaways (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  description  text,
  prize        text,
  active       boolean NOT NULL DEFAULT true,
  ends_at      date,
  winner_name  text,
  winner_entry uuid,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE public.giveaway_actions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id uuid NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  label       text NOT NULL,
  tickets     integer NOT NULL DEFAULT 1,
  icon        text DEFAULT '⭐',
  sort_order  integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE public.giveaway_entries (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id       uuid NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  name              text NOT NULL,
  instagram_handle  text,
  email             text,
  client_id         uuid REFERENCES public.clients(id),
  actions_completed uuid[] DEFAULT '{}',   -- array of giveaway_actions.id
  tickets_total     integer NOT NULL DEFAULT 0,
  created_at        timestamptz DEFAULT now(),
  UNIQUE (giveaway_id, email)
);

ALTER TABLE public.giveaways         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_actions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_entries  ENABLE ROW LEVEL SECURITY;

-- Público: leer giveaways activos y sus acciones
CREATE POLICY "Public read active giveaways" ON public.giveaways
  FOR SELECT USING (active = true);
CREATE POLICY "Public read giveaway actions" ON public.giveaway_actions
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.giveaways WHERE id = giveaway_id AND active = true));

-- Público: insertar entradas en giveaways activos
CREATE POLICY "Public insert entries" ON public.giveaway_entries
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.giveaways WHERE id = giveaway_id AND active = true));

-- Admin: acceso total
CREATE POLICY "Admin giveaways" ON public.giveaways
  FOR ALL USING (EXISTS (SELECT 1 FROM public.clients WHERE auth_user_id = auth.uid() AND is_admin = true));
CREATE POLICY "Admin giveaway_actions" ON public.giveaway_actions
  FOR ALL USING (EXISTS (SELECT 1 FROM public.clients WHERE auth_user_id = auth.uid() AND is_admin = true));
CREATE POLICY "Admin giveaway_entries" ON public.giveaway_entries
  FOR ALL USING (EXISTS (SELECT 1 FROM public.clients WHERE auth_user_id = auth.uid() AND is_admin = true));
