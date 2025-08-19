-- Create assessment_progress table to track incomplete assessments
CREATE TABLE IF NOT EXISTS public.assessment_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL,
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    answer TEXT,
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_assessment_progress_session_id ON assessment_progress(session_id);
CREATE INDEX idx_assessment_progress_assessment_id ON assessment_progress(assessment_id);
CREATE INDEX idx_assessment_progress_created_at ON assessment_progress(created_at);

-- Create assessment_sessions table to track overall session info
CREATE TABLE IF NOT EXISTS public.assessment_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL UNIQUE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    user_agent TEXT,
    referrer_source TEXT,
    total_questions INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    drop_off_question_id TEXT,
    drop_off_question_number INTEGER,
    time_spent_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_assessment_sessions_session_id ON assessment_sessions(session_id);
CREATE INDEX idx_assessment_sessions_completed_at ON assessment_sessions(completed_at);
CREATE INDEX idx_assessment_sessions_created_at ON assessment_sessions(created_at);
CREATE INDEX idx_assessment_sessions_drop_off_question_id ON assessment_sessions(drop_off_question_id);

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_assessment_progress_updated_at BEFORE UPDATE ON assessment_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_sessions_updated_at BEFORE UPDATE ON assessment_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE assessment_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for assessment_progress
CREATE POLICY "Service role can manage assessment_progress" ON assessment_progress
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public can insert assessment_progress" ON assessment_progress
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update own assessment_progress" ON assessment_progress
    FOR UPDATE USING (session_id = (current_setting('app.session_id', true))::UUID);

-- RLS policies for assessment_sessions
CREATE POLICY "Service role can manage assessment_sessions" ON assessment_sessions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public can insert assessment_sessions" ON assessment_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update own assessment_sessions" ON assessment_sessions
    FOR UPDATE USING (session_id = (current_setting('app.session_id', true))::UUID);

-- Add comments
COMMENT ON TABLE assessment_progress IS 'Tracks individual question progress for assessments, including incomplete ones';
COMMENT ON TABLE assessment_sessions IS 'Tracks overall assessment session data for drop-off analysis';
COMMENT ON COLUMN assessment_sessions.drop_off_question_id IS 'The ID of the last question viewed before dropping off';
COMMENT ON COLUMN assessment_sessions.time_spent_seconds IS 'Total time spent on assessment before completion or drop-off';