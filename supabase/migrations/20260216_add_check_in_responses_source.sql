BEGIN;

ALTER TABLE public.check_in_responses
  ADD COLUMN IF NOT EXISTS source TEXT;

UPDATE public.check_in_responses
SET source = 'email_link'
WHERE source IS NULL;

COMMIT;
