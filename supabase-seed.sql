-- =============================================
-- EL DADO ERRANTE — Datos iniciales (juegos)
-- Correr DESPUÉS del schema
-- =============================================

insert into games (name, category, price, players, duration, type, image_url) values
  -- Party Games
  ('Skull King',                 'party',     4000, '2-6 jugadores',  '20-30 min', 'Cartas',      '/images/skullking.webp'),
  ('Taco Cat Goat Cheese Pizza', 'party',     3000, '2-8 jugadores',  '10 min',    'Party',       '/images/tacocat.webp'),
  ('Codenames',                  'party',     4000, '4-8 jugadores',  '15 min',    'Party',       '/images/codenames.webp'),
  ('Chameleon',                  'party',     4000, '3-8 jugadores',  '15 min',    'Deducción',   '/images/chameleon.webp'),
  ('Fantasma Blitz',             'party',     4000, '2-8 jugadores',  '5 min',     'Velocidad',   '/images/fantasmablitz.webp'),
  ('Cockroach Poker',            'party',     3000, '2-6 jugadores',  '20 min',    'Bluff',       '/images/pokerdebichos.webp'),
  ('Joking Hazard',              'party',     4000, '3-10 jugadores', '30 min',    'Party',       '/images/jokinghazzard.webp'),
  ('Trial by Trolley',           'party',     4000, '4-13 jugadores', '30 min',    'Party',       '/images/trialbytrolley.webp'),
  ('Fast Food Fear',             'party',     4000, '2-6 jugadores',  '20 min',    'Party',       '/images/fastfoodfear.webp'),
  ('Chao Pescao',                'party',     4000, '3-7 jugadores',  '15 min',    'Party',       '/images/chaopescao.webp'),
  ('Hues and Cues',              'party',     5000, '3-10 jugadores', '30 min',    'Party',       '/images/huesandcues.webp'),
  ('The Mind',                   'party',     3000, '2-4 jugadores',  '15 min',    'Cooperativo', '/images/themind.webp'),
  ('Sushi Go',                   'party',     4000, '2-5 jugadores',  '15 min',    'Cartas',      '/images/sushigo.webp'),
  -- Para Parejas
  ('Floristry',                  'parejas',   4000, '2 jugadores',    '30 min',    'Cooperativo', '/images/floristry.webp'),
  ('Coffee Rush',                'parejas',   4000, '2-4 jugadores',  '30 min',    'Casual',      '/images/coffeerush.webp'),
  ('Raptors',                    'parejas',   5000, '2 jugadores',    '30 min',    'Estrategia',  '/images/raptors.webp'),
  ('House of Danger',            'parejas',   5000, '1-6 jugadores',  '60 min',    'Aventura',    '/images/houseofdanger.webp'),
  -- Estrategia
  ('Catan',                      'estrategia',6000, '3-4 jugadores',  '60-120 min','Estrategia',  '/images/catan.webp'),
  ('Azul',                       'estrategia',6000, '2-4 jugadores',  '30-45 min', 'Abstracto',   '/images/azul.webp'),
  ('Ticket to Ride',             'estrategia',6000, '2-5 jugadores',  '45-75 min', 'Estrategia',  '/images/tickettoride.webp'),
  ('Villainous',                 'estrategia',5000, '2-6 jugadores',  '50 min',    'Competitivo', '/images/villainous.webp'),
  ('Pandemic',                   'estrategia',6000, '2-4 jugadores',  '45-60 min', 'Cooperativo', '/images/pandemic.webp'),
  ('King of Tokyo',              'estrategia',5000, '2-6 jugadores',  '30 min',    'Dados',       '/images/kingoftokyo.webp'),
  ('King of New York',           'estrategia',6000, '2-6 jugadores',  '40 min',    'Dados',       '/images/kingofnewyork.webp'),
  ('Kaiju Crush',                'estrategia',5000, '2-4 jugadores',  '30-45 min', 'Área',        '/images/kaijucrush.webp'),
  ('The Island',                 'estrategia',5000, '2-4 jugadores',  '60 min',    'Estrategia',  '/images/theisland.webp'),
  ('Here to Slay',               'estrategia',5000, '2-6 jugadores',  '30-60 min', 'Cartas',      '/images/heretoslay.webp'),
  ('Food Truck Race',            'estrategia',6000, '2-4 jugadores',  '45-60 min', 'Estrategia',  '/images/foodtruckrace.webp'),
  ('Sauros',                     'estrategia',6000, '2-4 jugadores',  '45 min',    'Estrategia',  '/images/sauros.webp');
