-- Add INSERT policy for communication_logs table
-- This ensures service_role can insert records (fixes SMS logging)
-- Even though service_role should bypass RLS, explicit policies prevent edge cases

-- First, check if policy already exists and drop it to avoid conflicts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'communication_logs'
    AND policyname = 'Service role can insert communication logs'
  ) THEN
    DROP POLICY "Service role can insert communication logs" ON communication_logs;
  END IF;
END $$;

-- Create INSERT policy for service_role
CREATE POLICY "Service role can insert communication logs"
  ON communication_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Also add UPDATE policy for webhook delivery status updates
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'communication_logs'
    AND policyname = 'Service role can update communication logs'
  ) THEN
    DROP POLICY "Service role can update communication logs" ON communication_logs;
  END IF;
END $$;

CREATE POLICY "Service role can update communication logs"
  ON communication_logs
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Verify policies were created
DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'communication_logs';

  RAISE NOTICE 'communication_logs now has % RLS policies', policy_count;
END $$;
