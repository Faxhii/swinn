-- ============================================================
-- SWIN Partner Dashboard – Run this ONCE in Supabase SQL Editor
-- Fixes: "new row violates row-level security policy for table profiles"
-- ============================================================

-- STEP 1: Add missing columns to profiles (safe – won't fail if they exist)
alter table public.profiles
  add column if not exists role text not null default 'partner'
    check (role in ('founder','partner')),
  add column if not exists joined_at timestamptz default now(),
  add column if not exists policy_accepted boolean not null default false,
  add column if not exists policy_accepted_at timestamptz;

-- STEP 2: Create a trigger function that auto-creates a profile
-- when a new user registers. Uses SECURITY DEFINER so it runs as
-- the DB owner and bypasses RLS entirely.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_name text;
  v_initials text;
begin
  -- Read name from the metadata passed during signUp
  v_name := coalesce(
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  v_initials := upper(left(v_name, 2));

  insert into public.profiles (id, name, email, avatar_initials, role, policy_accepted)
  values (new.id, v_name, new.email, v_initials, 'partner', false)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- STEP 3: Attach the trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- STEP 4: Make sure RLS policies exist on profiles
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'profiles'
      and policyname = 'Profiles are viewable by authenticated users'
  ) then
    execute 'create policy "Profiles are viewable by authenticated users"
      on public.profiles for select
      using (auth.role() = ''authenticated'')';
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'profiles'
      and policyname = 'Users can insert own profile'
  ) then
    execute 'create policy "Users can insert own profile"
      on public.profiles for insert
      with check (auth.uid() = id)';
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'profiles'
      and policyname = 'Users can update own profile'
  ) then
    execute 'create policy "Users can update own profile"
      on public.profiles for update
      using (auth.uid() = id)';
  end if;
end $$;

-- ============================================================
-- DONE. Now register again – it will work.
-- ============================================================
