-- =============================================
-- EL DADO ERRANTE — Schema inicial
-- Correr en Supabase > SQL Editor > New query
-- =============================================

-- Tabla de juegos
create table if not exists games (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null,        -- 'party' | 'parejas' | 'estrategia'
  price       integer not null,     -- precio en colones (ej: 4000)
  players     text not null,        -- ej: '2-6 jugadores'
  duration    text not null,        -- ej: '20-30 min'
  type        text not null,        -- ej: 'Cartas', 'Party', etc
  image_url   text,
  available   boolean not null default true,
  created_at  timestamptz default now()
);

-- Tabla de clientes
create table if not exists clients (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone         text,
  email         text,
  notes         text,
  created_at    timestamptz default now()
);

-- Tabla de reservas
create table if not exists reservations (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid references clients(id),
  game_id       uuid references games(id),
  start_date    date not null,
  end_date      date not null,
  status        text not null default 'pending',  -- 'pending' | 'active' | 'returned' | 'cancelled'
  notes         text,
  created_at    timestamptz default now()
);

-- =============================================
-- Seguridad: permitir lectura pública de juegos
-- =============================================
alter table games enable row level security;
alter table clients enable row level security;
alter table reservations enable row level security;

-- Cualquiera puede ver los juegos (para el catálogo)
create policy "Juegos visibles públicamente"
  on games for select
  using (true);

-- Cualquiera puede crear una reserva (formulario del sitio)
create policy "Crear reserva pública"
  on reservations for insert
  with check (true);

-- Cualquiera puede crear un cliente nuevo
create policy "Crear cliente público"
  on clients for insert
  with check (true);
