-- PainOptix V1.2 Schema
-- Supports 16-question algorithm and Educational Guides (FDA compliant)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE guide_type AS ENUM (
  'sciatica',
  'upper_lumbar_radiculopathy', 
  'si_joint_dysfunction',
  'canal_stenosis',
  'central_disc_bulge',
  'facet_arthropathy',
  'muscular_nslbp',
  'lumbar_instability',
  'urgent_symptoms'
);

CREATE TYPE payment_tier AS ENUM ('free', 'enhanced', 'comprehensive');

-- Main assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL DEFAULT uuid_generate_v4(),
  
  -- Contact info (required for V1.2)
  email TEXT,
  phone_number TEXT,
  contact_consent BOOLEAN DEFAULT false,
  
  -- Ensure at least one contact method
  CONSTRAINT contact_required CHECK (email IS NOT NULL OR phone_number IS NOT NULL),
  
  -- All 16 question responses stored as JSONB
  responses JSONB NOT NULL DEFAULT '{}',
  
  -- Tracking what user selected (for disclosures)
  disclosures TEXT[] DEFAULT '{}',
  
  -- Which educational guide was selected
  guide_type guide_type,
  guide_delivered_at TIMESTAMPTZ,
  guide_opened_at TIMESTAMPTZ,
  
  -- V1.2 tracking fields
  referrer_source TEXT,
  initial_pain_score INTEGER CHECK (initial_pain_score >= 0 AND initial_pain_score <= 10),
  
  -- Payment tracking
  payment_tier payment_tier DEFAULT 'free',
  payment_completed BOOLEAN DEFAULT false,
  stripe_session_id TEXT UNIQUE,
  
  -- PainCrowdsource integration
  enrolled_in_paincrowdsource BOOLEAN DEFAULT false,
  paincrowdsource_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_assessments_session ON assessments(session_id);
CREATE INDEX idx_assessments_email ON assessments(email);
CREATE INDEX idx_assessments_phone ON assessments(phone_number);
CREATE INDEX idx_assessments_guide ON assessments(guide_type);
CREATE INDEX idx_assessments_created ON assessments(created_at);

-- Table for guide delivery tracking
CREATE TABLE IF NOT EXISTS guide_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  delivery_method TEXT CHECK (delivery_method IN ('email', 'sms')),
  delivered_at TIMESTAMPTZ DEFAULT NOW(),
  delivery_status TEXT DEFAULT 'pending',
  opened_at TIMESTAMPTZ,
  error_message TEXT
);

-- Table for follow-up tracking
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  response_received_at TIMESTAMPTZ,
  outcome_data JSONB,
  incentive_claimed BOOLEAN DEFAULT false
);

-- Table for data deletion requests (GDPR)
CREATE TABLE IF NOT EXISTS deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL, -- email or phone
  verification_code TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE assessments IS 'Main table for storing PainOptix educational guide assessments';
COMMENT ON COLUMN assessments.responses IS 'JSONB storing all 16 question responses';
COMMENT ON COLUMN assessments.disclosures IS 'Array of user selections to display in guide';
COMMENT ON COLUMN assessments.guide_type IS 'Which of the 9 educational guides was delivered';