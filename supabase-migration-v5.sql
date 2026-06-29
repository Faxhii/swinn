-- ============================================================
-- SWIN – Database Migration v5: Make Database Public
-- Run this in the Supabase SQL Editor
-- ============================================================
-- Since the shared auto-login might fail if the email isn't
-- confirmed, this script removes all authentication requirements
-- for expenses and orders. Anyone who visits the dashboard
-- can add/delete without being blocked by RLS.

-- 1. EXPENSES TABLE (Public Access)
drop policy if exists "Partners can insert own expenses" on public.expenses;
drop policy if exists "Authenticated users can insert any expense" on public.expenses;
create policy "Public insert expenses" on public.expenses for insert with check (true);

drop policy if exists "Partners can delete own expenses" on public.expenses;
drop policy if exists "Authenticated users can delete any expense" on public.expenses;
create policy "Public delete expenses" on public.expenses for delete using (true);

drop policy if exists "Partners can update own expenses" on public.expenses;
drop policy if exists "Authenticated users can update any expense" on public.expenses;
create policy "Public update expenses" on public.expenses for update using (true);

drop policy if exists "Expenses viewable by authenticated users" on public.expenses;
create policy "Public view expenses" on public.expenses for select using (true);


-- 2. ORDERS TABLE (Public Access)
drop policy if exists "Authenticated users can insert orders" on public.orders;
create policy "Public insert orders" on public.orders for insert with check (true);

drop policy if exists "Orders viewable by authenticated users" on public.orders;
create policy "Public view orders" on public.orders for select using (true);


-- 3. PRODUCTS TABLE (Public Access)
drop policy if exists "Products viewable by authenticated users" on public.products;
create policy "Public view products" on public.products for select using (true);

drop policy if exists "Authenticated users can insert products" on public.products;
create policy "Public insert products" on public.products for insert with check (true);
