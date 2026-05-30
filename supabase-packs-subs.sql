-- =============================================
-- EL DADO ERRANTE — Packs, Suscripciones y RLS admin
-- Correr en Supabase > SQL Editor > New query
-- =============================================

-- Packs: combinación de juegos a precio especial
create table if not exists packs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  price       integer not null,
  available   boolean not null default true,
  created_at  timestamptz default now()
);

-- Relación pack <-> juegos
create table if not exists pack_games (
  pack_id uuid references packs(id) on delete cascade,
  game_id uuid references games(id) on delete cascade,
  primary key (pack_id, game_id)
);

-- Planes de suscripción
create table if not exists subscription_plans (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  price            integer not null,
  games_count      integer not null,
  changes_allowed  integer not null default 2,
  description      text,
  active           boolean not null default true,
  featured         boolean not null default false,
  created_at       timestamptz default now()
);

-- Suscripciones activas de clientes
create table if not exists client_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references clients(id),
  plan_id     uuid references subscription_plans(id),
  start_date  date not null default current_date,
  end_date    date,
  status      text not null default 'active',  -- 'active' | 'paused' | 'cancelled'
  created_at  timestamptz default now()
);

-- RLS: lectura pública de packs y planes
alter table packs enable row level security;
alter table pack_games enable row level security;
alter table subscription_plans enable row level security;
alter table client_subscriptions enable row level security;

create policy "Packs visibles públicamente"
  on packs for select using (true);

create policy "Pack games visibles"
  on pack_games for select using (true);

create policy "Planes visibles públicamente"
  on subscription_plans for select using (true);

-- RLS: admin (usuario autenticado) puede hacer todo
create policy "Admin gestiona juegos"
  on games for all to authenticated using (true) with check (true);

create policy "Admin gestiona clientes"
  on clients for all to authenticated using (true) with check (true);

create policy "Admin gestiona reservas"
  on reservations for all to authenticated using (true) with check (true);

create policy "Admin gestiona packs"
  on packs for all to authenticated using (true) with check (true);

create policy "Admin gestiona pack_games"
  on pack_games for all to authenticated using (true) with check (true);

create policy "Admin gestiona planes"
  on subscription_plans for all to authenticated using (true) with check (true);

create policy "Admin gestiona suscripciones de clientes"
  on client_subscriptions for all to authenticated using (true) with check (true);

-- Seed: planes iniciales (los que ya están hardcodeados en la web)
insert into subscription_plans (name, price, games_count, changes_allowed, featured) values
  ('Casual', 8000,  1, 2, false),
  ('Jugón',  15000, 2, 3, true),
  ('Party',  22000, 3, 4, false);
