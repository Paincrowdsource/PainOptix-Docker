-- Add missing admin RLS policies for assessment tracking tables
-- This fixes the drop-off analytics showing 0 data in admin dashboard

-- Policy for assessment_sessions
CREATE POLICY IF NOT EXISTS "Admins can view assessment_sessions"
ON assessment_sessions FOR SELECT
TO public
USING (is_admin());

-- Policy for assessment_progress
CREATE POLICY IF NOT EXISTS "Admins can view assessment_progress"
ON assessment_progress FOR SELECT
TO public
USING (is_admin());

-- Allow admins to update assessment_sessions (for fixing data)
CREATE POLICY IF NOT EXISTS "Admins can update assessment_sessions"
ON assessment_sessions FOR UPDATE
TO public
USING (is_admin());

-- Allow admins to update assessment_progress (for fixing data)
CREATE POLICY IF NOT EXISTS "Admins can update assessment_progress"
ON assessment_progress FOR UPDATE
TO public
USING (is_admin());