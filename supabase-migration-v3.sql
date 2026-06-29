-- ============================================================
-- SWIN – RLS Migration v3: Shared Dashboard Account
-- Run this in the Supabase SQL Editor after creating the
-- shared dashboard account (dashboard@swin.in or similar).
-- ============================================================

-- Allow any authenticated user to INSERT an expense for ANY partner_id.
-- This replaces the old "only own" policy so the shared dashboard account
-- can log expenses on behalf of Fadhi, Hisham, Sinan SV, Mohammed etc.

drop policy if exists "Partners can insert own expenses" on public.expenses;

create policy "Authenticated users can insert any expense"
  on public.expenses for insert
  with check (auth.role() = 'authenticated');

-- Also allow any authenticated user to delete any expense
-- (since there is no per-user ownership in the no-login flow)
drop policy if exists "Partners can delete own expenses" on public.expenses;

create policy "Authenticated users can delete any expense"
  on public.expenses for delete
  using (auth.role() = 'authenticated');

-- Allow any authenticated user to update any expense
drop policy if exists "Partners can update own expenses" on public.expenses;

create policy "Authenticated users can update any expense"
  on public.expenses for update
  using (auth.role() = 'authenticated');
