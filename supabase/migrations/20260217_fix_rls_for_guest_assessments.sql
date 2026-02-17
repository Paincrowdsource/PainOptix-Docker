-- Pre-flight health check: Fix RLS policies to match Phase 1-4 data model
-- 1. Assessments INSERT policy: allow is_guest=true without contact info
-- 2. check_in_responses: add missing policy (RLS enabled but 0 policies defined)

-- Fix assessments INSERT policy to allow guest assessments (is_guest=true without contact)
DROP POLICY IF EXISTS "Allow assessment creation only" ON assessments;
CREATE POLICY "Allow assessment creation only" ON assessments
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    (is_guest = true)
    OR (
      guide_type IS NOT NULL
      AND responses IS NOT NULL
      AND (email IS NOT NULL OR phone_number IS NOT NULL)
    )
  );

-- Add explicit policy for check_in_responses (currently RLS enabled but 0 policies)
CREATE POLICY "Service role full access check_in_responses"
  ON check_in_responses FOR ALL
  USING (true) WITH CHECK (true);
