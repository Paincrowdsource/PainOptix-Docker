-- Value-First Implementation Metrics View
-- This view provides KPIs for measuring the success of the value-first results preview

-- Create a view that aggregates value-first funnel metrics
CREATE OR REPLACE VIEW value_first_metrics AS
WITH assessment_completions AS (
  -- Sessions that completed all questions (before results screen)
  SELECT
    session_id,
    created_at::date as completion_date,
    created_at as completed_at
  FROM assessment_progress
  WHERE question_id NOT IN ('RESULTS_PREVIEW_VIEW', 'RESULTS_PREVIEW_CTA_CLICK')
    AND answer IS NOT NULL
  GROUP BY session_id, created_at::date, created_at
  HAVING COUNT(DISTINCT question_id) >= 8 -- At least 8 questions answered
),
results_views AS (
  -- Sessions that viewed the results preview screen
  SELECT
    ap.session_id,
    ap.created_at::date as view_date,
    ap.created_at as viewed_at,
    ap.question_text as diagnosis
  FROM assessment_progress ap
  WHERE ap.question_id = 'RESULTS_PREVIEW_VIEW'
),
cta_clicks AS (
  -- Sessions that clicked "Get My Complete Guide" CTA
  SELECT
    ap.session_id,
    ap.created_at::date as click_date,
    ap.created_at as clicked_at
  FROM assessment_progress ap
  WHERE ap.question_id = 'RESULTS_PREVIEW_CTA_CLICK'
),
email_captures AS (
  -- Sessions that provided email/phone (completed the assessment)
  SELECT
    s.session_id,
    s.completed_at::date as capture_date,
    s.completed_at
  FROM assessment_sessions s
  WHERE s.assessment_id IS NOT NULL
    AND s.completed_at IS NOT NULL
)
SELECT
  COALESCE(ac.completion_date, rv.view_date, cc.click_date, ec.capture_date) as date,

  -- Assessment Completions
  COUNT(DISTINCT ac.session_id) as assessments_completed,

  -- Results Preview Views
  COUNT(DISTINCT rv.session_id) as results_viewed,
  ROUND(
    CASE
      WHEN COUNT(DISTINCT ac.session_id) > 0
      THEN (COUNT(DISTINCT rv.session_id)::numeric / COUNT(DISTINCT ac.session_id) * 100)
      ELSE 0
    END,
    2
  ) as results_view_rate_pct,

  -- CTA Clicks
  COUNT(DISTINCT cc.session_id) as cta_clicked,
  ROUND(
    CASE
      WHEN COUNT(DISTINCT rv.session_id) > 0
      THEN (COUNT(DISTINCT cc.session_id)::numeric / COUNT(DISTINCT rv.session_id) * 100)
      ELSE 0
    END,
    2
  ) as cta_click_rate_pct,

  -- Email Captures
  COUNT(DISTINCT ec.session_id) as emails_captured,
  ROUND(
    CASE
      WHEN COUNT(DISTINCT cc.session_id) > 0
      THEN (COUNT(DISTINCT ec.session_id)::numeric / COUNT(DISTINCT cc.session_id) * 100)
      ELSE 0
    END,
    2
  ) as email_capture_rate_pct,

  -- Overall Conversion (Assessment → Email)
  ROUND(
    CASE
      WHEN COUNT(DISTINCT ac.session_id) > 0
      THEN (COUNT(DISTINCT ec.session_id)::numeric / COUNT(DISTINCT ac.session_id) * 100)
      ELSE 0
    END,
    2
  ) as overall_conversion_rate_pct

FROM assessment_completions ac
FULL OUTER JOIN results_views rv ON ac.session_id = rv.session_id AND ac.completion_date = rv.view_date
FULL OUTER JOIN cta_clicks cc ON ac.session_id = cc.session_id AND ac.completion_date = cc.click_date
FULL OUTER JOIN email_captures ec ON ac.session_id = ec.session_id AND ac.completion_date = ec.capture_date
GROUP BY COALESCE(ac.completion_date, rv.view_date, cc.click_date, ec.capture_date)
ORDER BY date DESC;

-- Create a view for individual session time on results screen
CREATE OR REPLACE VIEW value_first_session_times AS
SELECT
  rv.session_id,
  rv.created_at as viewed_at,
  cc.created_at as clicked_at,
  EXTRACT(EPOCH FROM (cc.created_at - rv.created_at)) as time_on_results_seconds,
  ROUND(EXTRACT(EPOCH FROM (cc.created_at - rv.created_at))::numeric / 60, 2) as time_on_results_minutes,
  rv.question_text as diagnosis,
  CASE
    WHEN ec.completed_at IS NOT NULL THEN true
    ELSE false
  END as converted_to_email
FROM assessment_progress rv
LEFT JOIN assessment_progress cc
  ON rv.session_id = cc.session_id
  AND cc.question_id = 'RESULTS_PREVIEW_CTA_CLICK'
LEFT JOIN assessment_sessions s
  ON rv.session_id = s.session_id
LEFT JOIN (
  SELECT session_id, completed_at
  FROM assessment_sessions
  WHERE assessment_id IS NOT NULL
) ec ON rv.session_id = ec.session_id
WHERE rv.question_id = 'RESULTS_PREVIEW_VIEW'
ORDER BY rv.created_at DESC;

-- Create aggregate stats view for easy dashboard display
CREATE OR REPLACE VIEW value_first_summary AS
WITH recent_data AS (
  SELECT *
  FROM value_first_metrics
  WHERE date >= CURRENT_DATE - INTERVAL '30 days'
),
time_stats AS (
  SELECT
    AVG(time_on_results_seconds) as avg_time_seconds,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY time_on_results_seconds) as median_time_seconds,
    COUNT(*) as sessions_with_time_data
  FROM value_first_session_times
  WHERE viewed_at >= CURRENT_DATE - INTERVAL '30 days'
    AND clicked_at IS NOT NULL
)
SELECT
  -- Last 7 days
  (SELECT SUM(assessments_completed) FROM recent_data WHERE date >= CURRENT_DATE - 7) as last_7d_assessments,
  (SELECT SUM(results_viewed) FROM recent_data WHERE date >= CURRENT_DATE - 7) as last_7d_results_viewed,
  (SELECT SUM(cta_clicked) FROM recent_data WHERE date >= CURRENT_DATE - 7) as last_7d_cta_clicked,
  (SELECT SUM(emails_captured) FROM recent_data WHERE date >= CURRENT_DATE - 7) as last_7d_emails_captured,

  -- Last 7 days rates
  ROUND(
    CASE
      WHEN (SELECT SUM(assessments_completed) FROM recent_data WHERE date >= CURRENT_DATE - 7) > 0
      THEN ((SELECT SUM(results_viewed) FROM recent_data WHERE date >= CURRENT_DATE - 7)::numeric /
            (SELECT SUM(assessments_completed) FROM recent_data WHERE date >= CURRENT_DATE - 7) * 100)
      ELSE 0
    END,
    2
  ) as last_7d_results_view_rate,

  ROUND(
    CASE
      WHEN (SELECT SUM(results_viewed) FROM recent_data WHERE date >= CURRENT_DATE - 7) > 0
      THEN ((SELECT SUM(cta_clicked) FROM recent_data WHERE date >= CURRENT_DATE - 7)::numeric /
            (SELECT SUM(results_viewed) FROM recent_data WHERE date >= CURRENT_DATE - 7) * 100)
      ELSE 0
    END,
    2
  ) as last_7d_cta_click_rate,

  ROUND(
    CASE
      WHEN (SELECT SUM(cta_clicked) FROM recent_data WHERE date >= CURRENT_DATE - 7) > 0
      THEN ((SELECT SUM(emails_captured) FROM recent_data WHERE date >= CURRENT_DATE - 7)::numeric /
            (SELECT SUM(cta_clicked) FROM recent_data WHERE date >= CURRENT_DATE - 7) * 100)
      ELSE 0
    END,
    2
  ) as last_7d_email_capture_rate,

  ROUND(
    CASE
      WHEN (SELECT SUM(assessments_completed) FROM recent_data WHERE date >= CURRENT_DATE - 7) > 0
      THEN ((SELECT SUM(emails_captured) FROM recent_data WHERE date >= CURRENT_DATE - 7)::numeric /
            (SELECT SUM(assessments_completed) FROM recent_data WHERE date >= CURRENT_DATE - 7) * 100)
      ELSE 0
    END,
    2
  ) as last_7d_overall_conversion,

  -- Last 30 days
  (SELECT SUM(assessments_completed) FROM recent_data) as last_30d_assessments,
  (SELECT SUM(results_viewed) FROM recent_data) as last_30d_results_viewed,
  (SELECT SUM(cta_clicked) FROM recent_data) as last_30d_cta_clicked,
  (SELECT SUM(emails_captured) FROM recent_data) as last_30d_emails_captured,

  -- Last 30 days rates
  ROUND(
    CASE
      WHEN (SELECT SUM(assessments_completed) FROM recent_data) > 0
      THEN ((SELECT SUM(results_viewed) FROM recent_data)::numeric /
            (SELECT SUM(assessments_completed) FROM recent_data) * 100)
      ELSE 0
    END,
    2
  ) as last_30d_results_view_rate,

  ROUND(
    CASE
      WHEN (SELECT SUM(results_viewed) FROM recent_data) > 0
      THEN ((SELECT SUM(cta_clicked) FROM recent_data)::numeric /
            (SELECT SUM(results_viewed) FROM recent_data) * 100)
      ELSE 0
    END,
    2
  ) as last_30d_cta_click_rate,

  ROUND(
    CASE
      WHEN (SELECT SUM(cta_clicked) FROM recent_data) > 0
      THEN ((SELECT SUM(emails_captured) FROM recent_data)::numeric /
            (SELECT SUM(cta_clicked) FROM recent_data) * 100)
      ELSE 0
    END,
    2
  ) as last_30d_email_capture_rate,

  ROUND(
    CASE
      WHEN (SELECT SUM(assessments_completed) FROM recent_data) > 0
      THEN ((SELECT SUM(emails_captured) FROM recent_data)::numeric /
            (SELECT SUM(assessments_completed) FROM recent_data) * 100)
      ELSE 0
    END,
    2
  ) as last_30d_overall_conversion,

  -- Time on results screen stats
  ROUND(avg_time_seconds, 2) as avg_time_on_results_seconds,
  ROUND(median_time_seconds, 2) as median_time_on_results_seconds,
  sessions_with_time_data

FROM time_stats;

-- Grant access to authenticated and service roles
GRANT SELECT ON value_first_metrics TO authenticated, service_role, anon;
GRANT SELECT ON value_first_session_times TO authenticated, service_role, anon;
GRANT SELECT ON value_first_summary TO authenticated, service_role, anon;

-- Add helpful comments
COMMENT ON VIEW value_first_metrics IS 'Daily value-first funnel metrics showing conversion from assessment completion through email capture';
COMMENT ON VIEW value_first_session_times IS 'Individual session timing data for results screen engagement';
COMMENT ON VIEW value_first_summary IS 'Aggregated 7-day and 30-day value-first performance metrics';
