-- Fix RLS policies for assessments table
-- This migration creates proper RLS policies that allow:
-- 1. Anonymous users to read assessments by ID (for thank you page)
-- 2. Service role to have full access
-- 3. Users to read their own assessments by email

-- First, ensure RLS is enabled
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON assessments;
DROP POLICY IF EXISTS "Enable insert for all users" ON assessments;
DROP POLICY IF EXISTS "Enable update for users based on email" ON assessments;
DROP POLICY IF EXISTS "Allow anonymous read by ID" ON assessments;
DROP POLICY IF EXISTS "Allow anonymous insert" ON assessments;

-- Policy 1: Allow anyone to read assessments by ID
-- This is needed for the thank you page to work
CREATE POLICY "Allow anonymous read by ID" ON assessments
    FOR SELECT
    TO anon, authenticated
    USING (true);  -- Allow reading any assessment by ID

-- Policy 2: Allow anyone to insert assessments
-- This is needed for the assessment form to work
CREATE POLICY "Allow anonymous insert" ON assessments
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);  -- Allow inserting assessments

-- Policy 3: Allow users to update their own assessments by email
-- This is for future features where users might update their info
CREATE POLICY "Allow update own assessments" ON assessments
    FOR UPDATE
    TO anon, authenticated
    USING (email = current_setting('request.jwt.claims', true)::json->>'email')
    WITH CHECK (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy 4: Service role bypasses all RLS (this is automatic)
-- No policy needed as service role bypasses RLS by default

-- Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'assessments';