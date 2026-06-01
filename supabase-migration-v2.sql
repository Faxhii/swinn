-- ============================================================
-- SWIN Partner Dashboard – Migration from v1 → v2
-- Run this if you already applied the old supabase-schema.sql
-- ============================================================

-- Add new columns to profiles (safe - uses IF NOT EXISTS equivalent)
alter table public.profiles
  add column if not exists role text not null default 'partner'
    check (role in ('founder','partner')),
  add column if not exists joined_at timestamptz default now(),
  add column if not exists policy_accepted boolean not null default false,
  add column if not exists policy_accepted_at timestamptz;

-- Add new columns to products
alter table public.products
  add column if not exists price numeric(10,2) default 0,
  add column if not exists sizes text[],
  add column if not exists stock integer default 0;

-- Fix category constraint on products (add Accessories if missing)
-- (Skip if already correct)

-- Add new columns to orders
alter table public.orders
  add column if not exists size text,
  add column if not exists created_at timestamptz default now();

-- Add delete policy for expenses (own only)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'expenses' and policyname = 'Partners can delete own expenses'
  ) then
    execute 'create policy "Partners can delete own expenses"
      on public.expenses for delete
      using (auth.uid() = partner_id)';
  end if;
end $$;

-- ============================================================
-- TO SET A PARTNER AS FOUNDER after running migration:
--   update profiles set role = 'founder' where email = 'your@email.com';
-- ============================================================
