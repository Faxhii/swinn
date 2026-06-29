-- ============================================================
-- SWIN – Database Migration v4: Direct Partner Names
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Remove the foreign key constraint that requires partner_id 
--    to be a valid UUID from the profiles table.
alter table public.expenses drop constraint if exists expenses_partner_id_fkey;

-- 2. Change the column type from UUID to text so we can just
--    store the plain name (e.g., "Fadhi", "Hisham") directly.
alter table public.expenses alter column partner_id type text using partner_id::text;
