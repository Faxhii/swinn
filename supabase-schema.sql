-- ============================================================
-- SWIN Partner Dashboard – Full Supabase Schema v2
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. PROFILES
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  name              text not null,
  email             text not null,
  avatar_initials   text not null default '',
  role              text not null default 'partner' check (role in ('founder', 'partner')),
  joined_at         timestamptz default now(),
  policy_accepted   boolean not null default false,
  policy_accepted_at timestamptz
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);


-- 2. PRODUCTS
create table if not exists public.products (
  id       uuid primary key default gen_random_uuid(),
  name     text not null,
  category text not null check (category in ('Shirts','Pants','Hoodies','Accessories')),
  price    numeric(10,2) default 0,
  sizes    text[],
  stock    integer default 0
);

alter table public.products enable row level security;

create policy "Products viewable by authenticated users"
  on public.products for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert products"
  on public.products for insert
  with check (auth.role() = 'authenticated');


-- 3. ORDERS
create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references public.products(id) on delete cascade,
  quantity    integer not null default 1,
  size        text,
  revenue     numeric(12,2) not null default 0,
  date        date not null default current_date,
  created_at  timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Orders viewable by authenticated users"
  on public.orders for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert orders"
  on public.orders for insert
  with check (auth.role() = 'authenticated');


-- 4. EXPENSES
create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  partner_id  uuid references public.profiles(id) on delete cascade,
  amount      numeric(12,2) not null,
  category    text not null check (category in ('Marketing','Production','Logistics','Equipment','Other')),
  note        text,
  date        date not null default current_date,
  created_at  timestamptz default now()
);

alter table public.expenses enable row level security;

create policy "Expenses viewable by authenticated users"
  on public.expenses for select
  using (auth.role() = 'authenticated');

create policy "Partners can insert own expenses"
  on public.expenses for insert
  with check (auth.uid() = partner_id);

create policy "Partners can update own expenses"
  on public.expenses for update
  using (auth.uid() = partner_id);

-- IMPORTANT: Only allow partners to delete their own expenses
create policy "Partners can delete own expenses"
  on public.expenses for delete
  using (auth.uid() = partner_id);


-- ============================================================
-- SEED DATA (Optional – remove if you don't need demo data)
-- ============================================================

-- Products
insert into public.products (name, category, price, sizes, stock) values
  ('Classic White Tee', 'Shirts', 499, ARRAY['S','M','L','XL'], 120),
  ('Polo Shirt', 'Shirts', 799, ARRAY['M','L','XL'], 60),
  ('Slim Chinos', 'Pants', 1199, ARRAY['28','30','32','34'], 45),
  ('Cargo Pants', 'Pants', 1499, ARRAY['30','32','34'], 30),
  ('Pullover Hoodie', 'Hoodies', 1199, ARRAY['S','M','L','XL'], 80),
  ('Zip Hoodie', 'Hoodies', 1399, ARRAY['M','L','XL'], 50),
  ('Cap', 'Accessories', 349, ARRAY['Free Size'], 200),
  ('Tote Bag', 'Accessories', 249, ARRAY['One Size'], 150)
on conflict do nothing;

-- Sample orders (run AFTER products are inserted)
-- Replace product UUIDs or use subqueries as shown:
insert into public.orders (product_id, quantity, size, revenue, date) values
  ((select id from products where name = 'Classic White Tee' limit 1), 30, 'M', 14970, '2025-03-10'),
  ((select id from products where name = 'Classic White Tee' limit 1), 20, 'L', 9980, '2025-04-05'),
  ((select id from products where name = 'Slim Chinos' limit 1), 15, '32', 17985, '2025-03-20'),
  ((select id from products where name = 'Slim Chinos' limit 1), 10, '30', 11990, '2025-04-15'),
  ((select id from products where name = 'Pullover Hoodie' limit 1), 18, 'L', 21582, '2025-03-25'),
  ((select id from products where name = 'Pullover Hoodie' limit 1), 12, 'M', 14388, '2025-05-10'),
  ((select id from products where name = 'Cap' limit 1), 50, 'Free Size', 17450, '2025-04-01'),
  ((select id from products where name = 'Tote Bag' limit 1), 40, 'One Size', 9960, '2025-05-20'),
  ((select id from products where name = 'Polo Shirt' limit 1), 25, 'L', 19975, '2025-05-15'),
  ((select id from products where name = 'Cargo Pants' limit 1), 8, '32', 11992, '2025-05-28')
on conflict do nothing;

-- ============================================================
-- TO SET A PARTNER AS FOUNDER:
-- Update the role after they register:
--   update profiles set role = 'founder' where email = 'your@email.com';
-- ============================================================
