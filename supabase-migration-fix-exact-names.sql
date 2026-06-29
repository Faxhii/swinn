-- ============================================================
-- SWIN – Fix Exact Old Data Names
-- Run this in the Supabase SQL Editor
-- ============================================================
-- This script replaces the exact UUIDs from your screenshots
-- with their corresponding names.

UPDATE public.expenses 
SET partner_id = 'Sinan SV' 
WHERE partner_id = 'b016dfe3-d1e1-4207-8a2c-b511572fe88b';

UPDATE public.expenses 
SET partner_id = 'Mohammed' 
WHERE partner_id = '7678be6c-fc89-4655-960f-9ce0000f62c3';

UPDATE public.expenses 
SET partner_id = 'Annan' 
WHERE partner_id = '0e2eb2b3-15b7-4800-a556-0f1b3ee15101';
