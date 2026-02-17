BEGIN;

ALTER TABLE public.assessments
  DROP CONSTRAINT IF EXISTS contact_required;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'assessments_guest_or_contact_required'
      AND conrelid = 'public.assessments'::regclass
  ) THEN
    ALTER TABLE public.assessments
      ADD CONSTRAINT assessments_guest_or_contact_required
      CHECK (
        is_guest = true
        OR email IS NOT NULL
        OR phone_number IS NOT NULL
      );
  END IF;
END $$;

COMMIT;
