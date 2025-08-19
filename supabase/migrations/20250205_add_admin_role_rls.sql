-- Add user role support for admin access control

-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role TEXT DEFAULT 'user' CHECK (user_role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" 
ON profiles FOR ALL 
USING (auth.role() = 'service_role');

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND user_role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies on assessments that might conflict
DROP POLICY IF EXISTS "Service role has full access" ON assessments;
DROP POLICY IF EXISTS "Authenticated users can view own assessments" ON assessments;
DROP POLICY IF EXISTS "Anyone can create assessments" ON assessments;

-- Create new policies for assessments table
CREATE POLICY "Service role has full access" 
ON assessments FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Admin users can view all assessments" 
ON assessments FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admin users can update all assessments" 
ON assessments FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admin users can delete assessments" 
ON assessments FOR DELETE 
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view own assessments by email" 
ON assessments FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    email = auth.jwt() ->> 'email' 
    OR phone_number = auth.jwt() ->> 'phone'
  )
);

CREATE POLICY "Anyone can create assessments" 
ON assessments FOR INSERT 
WITH CHECK (true);

-- Create policies for other tables
-- Guide deliveries
DROP POLICY IF EXISTS "Service role has full access" ON guide_deliveries;

CREATE POLICY "Service role has full access" 
ON guide_deliveries FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Admin users can view all deliveries" 
ON guide_deliveries FOR SELECT 
USING (is_admin(auth.uid()));

-- Follow-ups
DROP POLICY IF EXISTS "Service role has full access" ON follow_ups;

CREATE POLICY "Service role has full access" 
ON follow_ups FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Admin users can view all follow-ups" 
ON follow_ups FOR SELECT 
USING (is_admin(auth.uid()));

-- Deletion requests
DROP POLICY IF EXISTS "Service role has full access" ON deletion_requests;
DROP POLICY IF EXISTS "Anyone can create deletion requests" ON deletion_requests;

CREATE POLICY "Service role has full access" 
ON deletion_requests FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Admin users can view all deletion requests" 
ON deletion_requests FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can create deletion requests" 
ON deletion_requests FOR INSERT 
WITH CHECK (true);

-- Create audit log table for admin actions
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and service role can access audit logs
CREATE POLICY "Service role has full access to audit logs" 
ON admin_audit_logs FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Admin users can view audit logs" 
ON admin_audit_logs FOR SELECT 
USING (is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON profiles(user_role);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);

-- Add comment documentation
COMMENT ON TABLE profiles IS 'User profiles with role-based access control';
COMMENT ON COLUMN profiles.user_role IS 'User role: user (default) or admin';
COMMENT ON TABLE admin_audit_logs IS 'Audit trail for admin actions';
COMMENT ON FUNCTION is_admin IS 'Check if a user has admin privileges';

-- Create assessment progress tracking policies if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessment_progress') THEN
    -- Service role access
    CREATE POLICY "Service role has full access to progress" 
    ON assessment_progress FOR ALL 
    USING (auth.role() = 'service_role');
    
    -- Admin access
    CREATE POLICY "Admin users can view all progress" 
    ON assessment_progress FOR SELECT 
    USING (is_admin(auth.uid()));
  END IF;
END $$;