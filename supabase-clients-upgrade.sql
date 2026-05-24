-- =============================================
-- EL DADO ERRANTE — Upgrade tabla clients
-- + vistas de analítica y cliente frecuente
-- Correr en Supabase > SQL Editor > New query
-- =============================================

-- 1. Ampliar tabla clients con ubicación y fidelidad
alter table clients
  add column if not exists province      text,
  add column if not exists district      text,
  add column if not exists address       text,
  add column if not exists birthday      date,
  add column if not exists loyalty_notified_at  timestamptz;
  -- loyalty_notified_at: cuándo se le avisó de su sorpresa (null = pendiente)

-- 2. Vista: resumen por cliente
--    Muestra cuántos alquileres tiene, cuál categoría prefiere,
--    cuándo fue el último alquiler y si ya califica para la sorpresa
create or replace view client_overview as
select
  c.id,
  c.name,
  c.phone,
  c.email,
  c.province,
  c.district,
  c.birthday,
  c.notes,
  c.created_at,
  c.loyalty_notified_at,

  -- Total de alquileres completados (status = 'returned')
  count(r.id) filter (where r.status = 'returned')          as total_rentals,

  -- Categoría favorita (la que más ha alquilado)
  (
    select g2.category
    from reservations r2
    join games g2 on g2.id = r2.game_id
    where r2.client_id = c.id and r2.status = 'returned'
    group by g2.category
    order by count(*) desc
    limit 1
  )                                                          as favorite_category,

  -- Juego favorito
  (
    select g3.name
    from reservations r3
    join games g3 on g3.id = r3.game_id
    where r3.client_id = c.id and r3.status = 'returned'
    group by g3.name
    order by count(*) desc
    limit 1
  )                                                          as favorite_game,

  -- Fecha del último alquiler
  max(r.end_date)                                            as last_rental_date,

  -- ¿Califica para la sorpresa? (10+ alquileres y aún no fue notificado)
  (
    count(r.id) filter (where r.status = 'returned') >= 10
    and c.loyalty_notified_at is null
  )                                                          as loyalty_reward_pending

from clients c
left join reservations r on r.client_id = c.id
group by c.id;

-- 3. Vista: analítica general del negocio
create or replace view business_stats as
select
  -- Juego más alquilado
  (
    select g.name
    from reservations r
    join games g on g.id = r.game_id
    where r.status = 'returned'
    group by g.name
    order by count(*) desc
    limit 1
  ) as top_game,

  -- Categoría más popular
  (
    select g.category
    from reservations r
    join games g on g.id = r.game_id
    where r.status = 'returned'
    group by g.category
    order by count(*) desc
    limit 1
  ) as top_category,

  -- Total de alquileres completados
  (select count(*) from reservations where status = 'returned') as total_rentals_completed,

  -- Total de clientes activos (al menos 1 alquiler)
  (select count(distinct client_id) from reservations where status = 'returned') as active_clients,

  -- Ingresos totales estimados (suma de precios de juegos alquilados)
  (
    select coalesce(sum(g.price), 0)
    from reservations r
    join games g on g.id = r.game_id
    where r.status = 'returned'
  ) as total_revenue,

  -- Clientes que califican para sorpresa y no han sido notificados
  (
    select count(*)
    from client_overview
    where loyalty_reward_pending = true
  ) as loyalty_rewards_pending;

-- 4. Vista: ranking de juegos por popularidad
create or replace view game_rankings as
select
  g.id,
  g.name,
  g.category,
  g.type,
  g.price,
  g.available,
  count(r.id) filter (where r.status = 'returned') as times_rented,
  count(r.id) filter (where r.status in ('pending','active')) as times_pending
from games g
left join reservations r on r.game_id = g.id
group by g.id
order by times_rented desc;

-- 5. Vista: zona geográfica más activa
create or replace view clients_by_province as
select
  coalesce(province, 'Sin registrar') as province,
  count(*)                             as total_clients,
  count(r.id) filter (where r.status = 'returned') as total_rentals
from clients c
left join reservations r on r.client_id = c.id
group by province
order by total_rentals desc;
