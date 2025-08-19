-- System logs table for storing application logs
CREATE TABLE system_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL CHECK (level IN ('error', 'warn', 'info', 'debug')),
  message TEXT NOT NULL,
  service TEXT DEFAULT 'painoptix',
  request_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB,
  error_stack TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX idx_system_logs_request_id ON system_logs(request_id);

-- Audit logs table (separate for compliance) - Note: This already exists, so we'll check first
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    CREATE TABLE audit_logs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      admin_id UUID NOT NULL REFERENCES profiles(id),
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      ip_address INET,
      user_agent TEXT,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
    CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
    CREATE INDEX idx_audit_logs_action ON audit_logs(action);
  END IF;
END $$;

-- Performance metrics table
CREATE TABLE performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT,
  tags JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance metrics
CREATE INDEX idx_performance_metrics_created_at ON performance_metrics(created_at DESC);
CREATE INDEX idx_performance_metrics_name ON performance_metrics(metric_name);

-- Create views for common queries
CREATE OR REPLACE VIEW recent_errors AS
SELECT 
  sl.*,
  u.email as user_email
FROM system_logs sl
LEFT JOIN auth.users u ON sl.user_id = u.id
WHERE sl.level = 'error' 
  AND sl.created_at > NOW() - INTERVAL '24 hours'
ORDER BY sl.created_at DESC 
LIMIT 100;

CREATE OR REPLACE VIEW daily_log_summary AS
SELECT 
  DATE(created_at) as date,
  level,
  COUNT(*) as log_count,
  COUNT(DISTINCT user_id) as affected_users,
  COUNT(DISTINCT request_id) as unique_requests
FROM system_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), level
ORDER BY date DESC, level;

CREATE OR REPLACE VIEW hourly_metrics AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  metric_name,
  AVG(value) as avg_value,
  MIN(value) as min_value,
  MAX(value) as max_value,
  COUNT(*) as sample_count
FROM performance_metrics
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), metric_name
ORDER BY hour DESC;

-- RLS policies
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Service role can insert logs
CREATE POLICY "Service role can insert system logs" ON system_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can insert metrics" ON performance_metrics
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Only admins can view logs
CREATE POLICY "Admins can view system logs" ON system_logs
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view metrics" ON performance_metrics
  FOR SELECT USING (is_admin(auth.uid()));

-- Admins can delete old logs
CREATE POLICY "Admins can delete old system logs" ON system_logs
  FOR DELETE USING (is_admin(auth.uid()) AND created_at < NOW() - INTERVAL '30 days');

-- Function to clean old logs (30 day retention for logs, 7 days for high-frequency metrics)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  -- Delete old system logs
  DELETE FROM system_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Delete old performance metrics
  DELETE FROM performance_metrics 
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  -- Log the cleanup
  INSERT INTO system_logs (level, message, service, metadata)
  VALUES (
    'info', 
    'Automated log cleanup completed', 
    'maintenance',
    jsonb_build_object(
      'deleted_logs_before', NOW() - INTERVAL '30 days',
      'deleted_metrics_before', NOW() - INTERVAL '7 days'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get error statistics
CREATE OR REPLACE FUNCTION get_error_stats(time_range INTERVAL DEFAULT INTERVAL '24 hours')
RETURNS TABLE (
  error_count BIGINT,
  unique_errors BIGINT,
  affected_users BIGINT,
  most_common_error TEXT,
  error_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH error_data AS (
    SELECT 
      COUNT(*) as total_errors,
      COUNT(DISTINCT message) as unique_errors,
      COUNT(DISTINCT user_id) as affected_users
    FROM system_logs
    WHERE level = 'error'
      AND created_at > NOW() - time_range
  ),
  total_logs AS (
    SELECT COUNT(*) as total_count
    FROM system_logs
    WHERE created_at > NOW() - time_range
  ),
  common_error AS (
    SELECT message
    FROM system_logs
    WHERE level = 'error'
      AND created_at > NOW() - time_range
    GROUP BY message
    ORDER BY COUNT(*) DESC
    LIMIT 1
  )
  SELECT 
    ed.total_errors,
    ed.unique_errors,
    ed.affected_users,
    ce.message,
    CASE 
      WHEN tl.total_count > 0 
      THEN ROUND((ed.total_errors::NUMERIC / tl.total_count) * 100, 2)
      ELSE 0
    END as error_rate
  FROM error_data ed
  CROSS JOIN total_logs tl
  LEFT JOIN common_error ce ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cleanup_old_logs() TO service_role;
GRANT EXECUTE ON FUNCTION get_error_stats(INTERVAL) TO authenticated;