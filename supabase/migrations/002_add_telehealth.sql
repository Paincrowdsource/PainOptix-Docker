-- Add telehealth consultation tracking
ALTER TABLE assessments 
ADD COLUMN telehealth_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN telehealth_scheduled_at TIMESTAMPTZ,
ADD COLUMN telehealth_provider_notes TEXT;

-- Create telehealth appointments table
CREATE TABLE IF NOT EXISTS telehealth_appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  meeting_link TEXT,
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled, no-show
  provider_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for queries
CREATE INDEX idx_telehealth_appointments_assessment ON telehealth_appointments(assessment_id);
CREATE INDEX idx_telehealth_appointments_scheduled ON telehealth_appointments(scheduled_for);