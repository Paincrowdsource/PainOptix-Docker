-- Extend follow_ups table for email scheduling
ALTER TABLE follow_ups
  ADD COLUMN IF NOT EXISTS sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS emailed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS run_at TIMESTAMPTZ;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_follow_ups_run_at_sent 
  ON follow_ups (run_at, sent) 
  WHERE sent = false;

-- Prevent double scheduling of the same pending follow-up
CREATE UNIQUE INDEX IF NOT EXISTS ux_followups_user_type_pending
  ON follow_ups (user_id, type)
  WHERE sent = false;

-- Create email events table for idempotency
CREATE TABLE IF NOT EXISTS email_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  assessment_id UUID,
  email_type TEXT NOT NULL,
  sent BOOLEAN DEFAULT false,
  dedupe_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for dedupe lookups
CREATE INDEX IF NOT EXISTS idx_email_events_dedupe_key 
  ON email_events (dedupe_key);

-- RPC function to claim a dedupe key atomically
CREATE OR REPLACE FUNCTION claim_email_send(dedupe_key TEXT)
RETURNS VOID 
LANGUAGE plpgsql 
AS $$
BEGIN
  INSERT INTO email_events (dedupe_key, email_type, sent) 
  VALUES (dedupe_key, 'auto', false);
EXCEPTION 
  WHEN unique_violation THEN
    RAISE EXCEPTION 'duplicate';
END;
$$;

-- Add marketing opt-out column to users if not exists
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS marketing_opted_out BOOLEAN DEFAULT false;

-- Add red flags column to assessment_results if not exists
ALTER TABLE assessment_results
  ADD COLUMN IF NOT EXISTS has_red_flags BOOLEAN DEFAULT false;

-- Only enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'email_events' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies only if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'email_events' 
    AND policyname = 'Service role full access to email_events'
  ) THEN
    CREATE POLICY "Service role full access to email_events" ON email_events
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Only enable RLS on follow_ups if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'follow_ups' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create follow_ups policy only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'follow_ups' 
    AND policyname = 'Service role full access to follow_ups'
  ) THEN
    CREATE POLICY "Service role full access to follow_ups" ON follow_ups
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Grant execute permission on RPC function
GRANT EXECUTE ON FUNCTION claim_email_send(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION claim_email_send(TEXT) TO authenticated;