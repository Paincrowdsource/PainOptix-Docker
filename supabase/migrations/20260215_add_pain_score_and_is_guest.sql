BEGIN;

ALTER TABLE public.check_in_responses
  ADD COLUMN IF NOT EXISTS pain_score INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_in_responses_pain_score_range'
      AND conrelid = 'public.check_in_responses'::regclass
  ) THEN
    ALTER TABLE public.check_in_responses
      ADD CONSTRAINT check_in_responses_pain_score_range
      CHECK (pain_score BETWEEN 0 AND 10);
  END IF;
END $$;

ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS is_guest BOOLEAN;

ALTER TABLE public.assessments
  ALTER COLUMN is_guest SET DEFAULT true;

-- Critical backfill fix:
UPDATE public.assessments
SET is_guest = CASE
  WHEN email IS NOT NULL OR phone_number IS NOT NULL THEN false
  ELSE true
END
WHERE is_guest IS NULL;

COMMIT;
