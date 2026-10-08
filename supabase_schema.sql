-- Apo's Kiosk - Supabase Schema
-- Einmalig im Supabase SQL Editor ausführen

-- Produkte
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  brand       text default '',
  barcode     text unique,
  price       numeric(6,2) not null default 0,
  stock       int not null default 0,
  category    text default 'sonstiges',
  image_url   text,
  active      boolean default true,
  created_at  timestamptz default now()
);

-- Mystery Box Tiers
create table if not exists mystery_box_tiers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (name in ('Standard', 'Premium', 'Premium+')),
  description text default '',
  price_1     numeric(6,2) not null default 1.50,
  price_3     numeric(6,2) not null default 4.00,
  price_5     numeric(6,2) not null default 6.00,
  price_10    numeric(6,2) not null default 11.00,
  active      boolean default true
);

-- Bestellungen
create table if not exists orders (
  id              uuid primary key default gen_random_uuid(),
  customer_name   text not null,
  items           jsonb not null default '[]',
  total           numeric(8,2) not null,
  pickup_time     text not null,
  status          text default 'pending' check (status in ('pending', 'ready', 'done')),
  note            text,
  created_at      timestamptz default now()
);

-- RLS: Produkte und Tiers sind öffentlich lesbar
alter table products enable row level security;
alter table mystery_box_tiers enable row level security;
alter table orders enable row level security;

create policy "products_public_read" on products for select using (true);
create policy "tiers_public_read" on mystery_box_tiers for select using (true);
create policy "orders_insert" on orders for insert with check (true);
create policy "orders_all" on orders for all using (true);
create policy "products_all" on products for all using (true);
create policy "tiers_all" on mystery_box_tiers for all using (true);

-- Starter-Daten für Mystery Box Tiers
insert into mystery_box_tiers (name, description, price_1, price_3, price_5, price_10) values
  ('Standard',  'Eigenmarke / günstige Produkte', 1.50, 4.00,  6.50,  12.00),
  ('Premium',   'Markenprodukte wie Milka',       2.50, 6.50,  10.00, 18.00),
  ('Premium+',  'Premium-Marken wie Lindt',        4.00, 10.50, 17.00, 30.00)
on conflict do nothing;
