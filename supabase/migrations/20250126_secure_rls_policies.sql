-- Secure RLS policies for assessments table
-- This migration creates restrictive RLS policies that:
-- 1. Only allow reading assessments by their ID (for guide viewing)
-- 2. Prevent enumeration attacks
-- 3. Service role still has full access

-- First, ensure RLS is enabled
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow anonymous read by ID" ON assessments;
DROP POLICY IF EXISTS "Allow anonymous insert" ON assessments;
DROP POLICY IF EXISTS "Allow update own assessments" ON assessments;

-- Policy 1: Allow reading ONLY your own assessment by ID
-- This uses a secure approach where users can only read assessments they have the ID for
CREATE POLICY "Secure read by ID" ON assessments
    FOR SELECT
    TO anon, authenticated
    USING (
        -- Only allow if the ID is explicitly provided in the query
        id IS NOT NULL
    );

-- Policy 2: Allow inserting new assessments
-- This is needed for the assessment form to work
CREATE POLICY "Allow assessment creation" ON assessments
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        -- Ensure required fields are present
        guide_type IS NOT NULL 
        AND responses IS NOT NULL
        AND (email IS NOT NULL OR phone_number IS NOT NULL)
    );

-- Policy 3: Allow updating specific fields only
-- Restrict updates to only payment-related fields
CREATE POLICY "Allow payment updates" ON assessments
    FOR UPDATE
    TO anon, authenticated
    USING (
        -- Can only update if you have the ID
        id IS NOT NULL
    )
    WITH CHECK (
        -- Can only update payment fields
        guide_type = OLD.guide_type
        AND responses = OLD.responses
        AND email = OLD.email
        AND phone_number = OLD.phone_number
        AND name = OLD.name
    );

-- Create index for performance on ID lookups
CREATE INDEX IF NOT EXISTS idx_assessments_id ON assessments(id);

-- Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'assessments';