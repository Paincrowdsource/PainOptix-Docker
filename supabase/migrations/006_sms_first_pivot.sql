-- ============================================================================
-- Migration: SMS-First Pivot (Phase 1)
-- Description: Add columns for SMS-first data collection
-- Date: 2025-11-30
-- ============================================================================

-- 1. Add new columns to assessments table
-- ============================================================================

-- SMS opt-in (explicit consent for SMS communications)
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS sms_opt_in BOOLEAN DEFAULT FALSE;

-- Timestamp when SMS consent was given (for compliance/audit)
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS sms_consent_timestamp TIMESTAMPTZ;

-- User's preferred delivery method: 'sms', 'email', or 'both'
-- Default to 'sms' for SMS-first approach
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'sms'
CHECK (delivery_method IN ('sms', 'email', 'both'));

-- Research ID for anonymized tracking (format: RES-XXXX)
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS research_id TEXT UNIQUE;

-- 2. Create sequence for research_id generation
-- ============================================================================

-- Start at 1000 so IDs begin at RES-1001
CREATE SEQUENCE IF NOT EXISTS research_id_seq START WITH 1000;

-- 3. Create trigger function for auto-generating research_id
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_research_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if research_id is NULL
  IF NEW.research_id IS NULL THEN
    NEW.research_id := 'RES-' || LPAD(nextval('research_id_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to auto-assign research_id on INSERT
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_generate_research_id ON assessments;

CREATE TRIGGER trigger_generate_research_id
BEFORE INSERT ON assessments
FOR EACH ROW
EXECUTE FUNCTION generate_research_id();

-- 5. Create indexes for new columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_assessments_research_id ON assessments(research_id);
CREATE INDEX IF NOT EXISTS idx_assessments_delivery_method ON assessments(delivery_method);
CREATE INDEX IF NOT EXISTS idx_assessments_sms_opt_in ON assessments(sms_opt_in) WHERE sms_opt_in = TRUE;

-- 6. Add comment documentation
-- ============================================================================

COMMENT ON COLUMN assessments.sms_opt_in IS 'Explicit consent for SMS communications';
COMMENT ON COLUMN assessments.sms_consent_timestamp IS 'When SMS consent was given (TCPA compliance)';
COMMENT ON COLUMN assessments.delivery_method IS 'Preferred delivery: sms, email, or both';
COMMENT ON COLUMN assessments.research_id IS 'Anonymized research identifier (format: RES-XXXX)';
