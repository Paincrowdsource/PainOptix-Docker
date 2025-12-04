-- ============================================================================
-- Migration: Backfill research_id for existing assessments
-- Description: Assigns RES-XXXX IDs to all existing records (ordered by created_at)
-- Date: 2025-11-30
-- IMPORTANT: Run this AFTER 006_sms_first_pivot.sql
-- ============================================================================

-- Backfill research_id for existing records
-- Orders by created_at so oldest users get lowest IDs (RES-1001, RES-1002, etc.)
-- ============================================================================

WITH numbered_assessments AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) + 1000 AS seq_num
  FROM assessments
  WHERE research_id IS NULL
)
UPDATE assessments a
SET research_id = 'RES-' || LPAD(na.seq_num::TEXT, 4, '0')
FROM numbered_assessments na
WHERE a.id = na.id;

-- Advance the sequence to avoid collisions with future inserts
-- ============================================================================

SELECT setval('research_id_seq',
  COALESCE(
    (SELECT MAX(SUBSTRING(research_id FROM 5)::INTEGER) FROM assessments WHERE research_id IS NOT NULL),
    1000
  )
);

-- Verify backfill
-- ============================================================================

DO $$
DECLARE
  null_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM assessments WHERE research_id IS NULL;
  SELECT COUNT(*) INTO total_count FROM assessments;

  IF null_count > 0 THEN
    RAISE WARNING 'Backfill incomplete: % of % records still have NULL research_id', null_count, total_count;
  ELSE
    RAISE NOTICE 'Backfill complete: % records updated', total_count;
  END IF;
END $$;
