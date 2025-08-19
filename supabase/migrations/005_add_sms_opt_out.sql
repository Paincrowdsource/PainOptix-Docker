-- Add SMS opt-out tracking for legal compliance
ALTER TABLE assessments 
ADD COLUMN sms_opted_out BOOLEAN DEFAULT FALSE;

-- Create an index for faster lookups when checking opt-out status
CREATE INDEX idx_assessments_phone_sms_opted_out 
ON assessments(phone_number, sms_opted_out) 
WHERE phone_number IS NOT NULL;

-- Create a table to track all SMS opt-outs (including non-assessment users)
CREATE TABLE IF NOT EXISTS sms_opt_outs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT NOT NULL UNIQUE,
  opted_out_at TIMESTAMPTZ DEFAULT NOW(),
  opt_out_source TEXT DEFAULT 'sms_stop', -- sms_stop, manual, web_form
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_sms_opt_outs_phone ON sms_opt_outs(phone_number);

-- RLS policies for sms_opt_outs table
ALTER TABLE sms_opt_outs ENABLE ROW LEVEL SECURITY;

-- Service role can manage all opt-outs
CREATE POLICY "Service role can manage SMS opt-outs" ON sms_opt_outs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anon users cannot access this table directly
CREATE POLICY "Anon users cannot access SMS opt-outs" ON sms_opt_outs
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);