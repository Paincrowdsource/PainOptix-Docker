-- V1.2 Follow-up Enhancements: 14-day follow-up, suppression, and health tracking

-- Create kv_health table for tracking last run times
CREATE TABLE IF NOT EXISTS kv_health (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default health keys
INSERT INTO kv_health (key, value) 
VALUES 
  ('scheduler_last_run', '{"timestamp": null}'::jsonb),
  ('stripe_webhook_last_success', '{"timestamp": null}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Add channel and template_key columns to communication_logs if not exists
ALTER TABLE communication_logs 
  ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS template_key VARCHAR(100);

-- Create index for efficient follow-up queries
CREATE INDEX IF NOT EXISTS idx_follow_ups_assessment_type_sent 
  ON follow_ups (assessment_id, type, sent);

-- Create index for communication_logs queries
CREATE INDEX IF NOT EXISTS idx_communication_logs_assessment_created 
  ON communication_logs (assessment_id, created_at DESC);

-- Add engagement tracking index
CREATE INDEX IF NOT EXISTS idx_communication_logs_engagement 
  ON communication_logs (assessment_id, opened_at, clicked_at) 
  WHERE opened_at IS NOT NULL OR clicked_at IS NOT NULL;

-- Function to check if user has engaged with emails
CREATE OR REPLACE FUNCTION has_email_engagement(p_assessment_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM communication_logs 
    WHERE assessment_id = p_assessment_id 
    AND (opened_at IS NOT NULL OR clicked_at IS NOT NULL)
  );
END;
$$ LANGUAGE plpgsql;

-- Function to cancel pending follow-ups on upgrade
CREATE OR REPLACE FUNCTION cancel_pending_followups(
  p_assessment_id UUID,
  p_types TEXT[]
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE follow_ups 
  SET sent = true, 
      emailed_at = NOW(),
      type = type || '_cancelled'
  WHERE assessment_id = p_assessment_id 
    AND type = ANY(p_types)
    AND sent = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update health status
CREATE OR REPLACE FUNCTION update_health_status(p_key TEXT, p_timestamp TIMESTAMPTZ DEFAULT NOW())
RETURNS VOID AS $$
BEGIN
  INSERT INTO kv_health (key, value, updated_at) 
  VALUES (p_key, jsonb_build_object('timestamp', p_timestamp), NOW())
  ON CONFLICT (key) 
  DO UPDATE SET 
    value = jsonb_build_object('timestamp', p_timestamp),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION has_email_engagement(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION cancel_pending_followups(UUID, TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION update_health_status(TEXT, TIMESTAMPTZ) TO service_role;

-- Grant access to kv_health
GRANT SELECT, INSERT, UPDATE ON kv_health TO service_role;

-- RLS for kv_health (service only)
ALTER TABLE kv_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to kv_health" ON kv_health
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);