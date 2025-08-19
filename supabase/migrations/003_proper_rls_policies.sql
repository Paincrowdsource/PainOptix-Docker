-- Apply proper RLS policies (more secure)
-- Run this in Supabase SQL Editor to fix the guide viewing issue
-- This allows the frontend to read assessments

-- Ensure RLS is enabled
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow public to read assessments" ON assessments;
DROP POLICY IF EXISTS "Allow users to create assessments" ON assessments;
DROP POLICY IF EXISTS "Service role can update" ON assessments;
DROP POLICY IF EXISTS "Allow public to read assessments by ID" ON assessments;
DROP POLICY IF EXISTS "Service role has full access" ON assessments;

-- Allow public to read assessments
CREATE POLICY "Allow public to read assessments" ON assessments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated users to create assessments
CREATE POLICY "Allow users to create assessments" ON assessments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow updates from service role only
CREATE POLICY "Service role can update" ON assessments
  FOR UPDATE
  TO service_role
  USING (true);

-- Also apply similar policies to guide_deliveries table
ALTER TABLE guide_deliveries ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies for guide_deliveries
DROP POLICY IF EXISTS "Allow public to read guide deliveries" ON guide_deliveries;
DROP POLICY IF EXISTS "Service role has full access to guide deliveries" ON guide_deliveries;

-- Allow public to read guide deliveries
CREATE POLICY "Allow public to read guide deliveries" ON guide_deliveries
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anon users to create guide deliveries
CREATE POLICY "Allow users to create guide deliveries" ON guide_deliveries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow service role to manage guide deliveries
CREATE POLICY "Service role can manage guide deliveries" ON guide_deliveries
  FOR ALL
  TO service_role
  USING (true); 