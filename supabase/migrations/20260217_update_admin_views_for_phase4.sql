-- Phase 4: Update admin-facing views to include new columns from Phases 1-3
-- v_assessments_visible: add is_guest
-- v_check_in_responses_visible: add pain_score, source

CREATE OR REPLACE VIEW public.v_assessments_visible AS
SELECT id, session_id, research_id, email, phone_number, contact_consent,
  responses, disclosures, guide_type, guide_delivered_at, guide_opened_at,
  referrer_source, initial_pain_score, payment_tier, payment_completed,
  stripe_session_id, enrolled_in_paincrowdsource, paincrowdsource_id,
  created_at, updated_at, telehealth_requested, telehealth_scheduled_at,
  telehealth_provider_notes, name, sms_opted_out, sms_opt_in,
  delivery_method, marketing_opted_out, has_red_flags, is_guest
FROM assessments a
WHERE NOT EXISTS (
  SELECT 1 FROM assessment_quarantine q WHERE q.assessment_id = a.id
);

CREATE OR REPLACE VIEW public.v_check_in_responses_visible AS
SELECT id, assessment_id, day, value, note, created_at, pain_score, source
FROM check_in_responses cr
WHERE NOT EXISTS (
  SELECT 1 FROM assessment_quarantine q WHERE q.assessment_id = cr.assessment_id
);
