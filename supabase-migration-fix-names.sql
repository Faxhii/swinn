-- ============================================================
-- SWIN – Fix Old Data Names
-- Run this in the Supabase SQL Editor
-- ============================================================
-- This script automatically finds the old UUIDs in your expenses table
-- and converts them to the real names ("Fadhi" and "Hisham").
-- It assigns "Fadhi" to the very first ID that ever created an expense,
-- and "Hisham" to the second one.

WITH ranked_ids AS (
  SELECT partner_id, min(created_at) as first_seen
  FROM public.expenses
  WHERE partner_id LIKE '%-%' -- Only match UUIDs
  GROUP BY partner_id
  ORDER BY first_seen ASC
)
UPDATE public.expenses e
SET partner_id = (
  CASE 
    WHEN e.partner_id = (SELECT partner_id FROM ranked_ids LIMIT 1) THEN 'Fadhi'
    WHEN e.partner_id = (SELECT partner_id FROM ranked_ids OFFSET 1 LIMIT 1) THEN 'Hisham'
    ELSE e.partner_id
  END
)
WHERE e.partner_id LIKE '%-%';
