-- =============================================
-- Agregar coordenadas GPS a clients
-- + actualizar vista client_overview con link Waze
-- =============================================

alter table clients
  add column if not exists lat  double precision,
  add column if not exists lng  double precision;

-- Drop en cascada para poder recrear con columnas nuevas
drop view if exists business_stats cascade;
drop view if exists clients_by_province cascade;
drop view if exists game_rankings cascade;
drop view if exists client_overview cascade;

create view client_overview as
select
  c.id,
  c.name,
  c.phone,
  c.email,
  c.province,
  c.district,
  c.address,
  c.birthday,
  c.notes,
  c.created_at,
  c.loyalty_notified_at,
  c.lat,
  c.lng,

  -- Link para abrir directo en Waze desde el celu
  case
    when c.lat is not null and c.lng is not null
    then 'https://waze.com/ul?ll=' || c.lat || ',' || c.lng || '&navigate=yes'
    else null
  end as waze_link,

  count(r.id) filter (where r.status = 'returned')          as total_rentals,

  (
    select g2.category
    from reservations r2
    join games g2 on g2.id = r2.game_id
    where r2.client_id = c.id and r2.status = 'returned'
    group by g2.category order by count(*) desc limit 1
  ) as favorite_category,

  (
    select g3.name
    from reservations r3
    join games g3 on g3.id = r3.game_id
    where r3.client_id = c.id and r3.status = 'returned'
    group by g3.name order by count(*) desc limit 1
  ) as favorite_game,

  max(r.end_date) as last_rental_date,

  (
    count(r.id) filter (where r.status = 'returned') >= 10
    and c.loyalty_notified_at is null
  ) as loyalty_reward_pending

from clients c
left join reservations r on r.client_id = c.id
group by c.id;
