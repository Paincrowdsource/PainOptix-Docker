-- Create RLS policies for assessments table

-- Allow public read access to assessments by ID
CREATE POLICY "Allow public to read assessments by ID" ON assessments
  FOR SELECT
  USING (true);

-- Allow service role to do everything
CREATE POLICY "Service role has full access" ON assessments
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create similar policies for guide_deliveries
CREATE POLICY "Allow public to read guide deliveries" ON guide_deliveries
  FOR SELECT
  USING (true);

CREATE POLICY "Service role has full access to guide deliveries" ON guide_deliveries
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');