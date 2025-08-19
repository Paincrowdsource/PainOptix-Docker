-- Table for queueing PainCrowdsource syncs
CREATE TABLE IF NOT EXISTS paincrowdsource_sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  anon_id TEXT NOT NULL,
  guide_type TEXT NOT NULL,
  initial_pain_score INTEGER,
  status TEXT DEFAULT 'pending', -- pending, synced, failed
  sync_attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for queries
CREATE INDEX idx_sync_queue_status ON paincrowdsource_sync_queue(status);
CREATE INDEX idx_sync_queue_assessment ON paincrowdsource_sync_queue(assessment_id);