# Check-ins Rollout Guide

## Overview
This guide provides a step-by-step process for safely rolling out the check-ins feature from staging to production.

## Pre-Launch Checklist

### Code Safety
- [ ] All feature flags default to OFF (`CHECKINS_ENABLED=0`, `CHECKINS_SANDBOX=1`)
- [ ] Mailer kill-switch requires BOTH `CHECKINS_ENABLED==='1'` AND `CHECKINS_SANDBOX!=='1'`
- [ ] Secret scanner passes on all files
- [ ] All tests pass (`npm test`)
- [ ] Type checking passes (`npm run typecheck`)

### Content Preparation
- [ ] Brad's 81 micro-inserts imported and validated
- [ ] All inserts ≤25 words
- [ ] No forbidden medical phrases
- [ ] First-message default is 'same' variant per diagnosis (no 'generic' fallback)

## Staging Deployment

### 1. Initial Setup (Sandbox Mode)
```bash
# Staging environment variables
CHECKINS_ENABLED=1
CHECKINS_SANDBOX=1          # Keep ON for dry-run
CHECKINS_AUTOWIRE=0         # Keep OFF initially
CHECKINS_TOKEN_SECRET=<staging-secret>
CHECKINS_SEND_TZ=America/New_York
CHECKINS_SEND_WINDOW=08:00-20:00
CHECKINS_START_AT=          # Leave empty for staging
```

### 2. Content Import
```bash
# Import micro-inserts to staging
npx tsx scripts/checkins-import.ts --file content/checkins/micro-inserts.csv --dry-run
npx tsx scripts/checkins-import.ts --file content/checkins/micro-inserts.csv
```

### 3. Test Enqueue & Preview
```bash
# Create test assessment
# Get assessment ID from database

# Enqueue check-ins
curl -X POST https://staging.painoptix.com/api/checkins/enqueue \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -d '{"assessment_id":"<test-id>"}'

# Generate preview
npx tsx scripts/checkins-preview.ts --assessment <test-id> --day 3 --branch initial
```

### 4. Brad's Content Review
- [ ] Generate previews for all day/branch combinations
- [ ] Share HTML files with Brad for review
- [ ] Get written approval on content
- [ ] Document any requested changes

### 5. Test Dispatch (Sandbox)
```bash
# Dispatch in sandbox mode - no emails sent
curl -X POST https://staging.painoptix.com/api/checkins/dispatch \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Check logs for:
- Correct email composition
- Proper template selection
- Valid one-tap tokens
- No errors

### 6. Enable Real Sending (Staging Only)
```bash
# Update staging environment
CHECKINS_SANDBOX=0  # Enable actual sending
```

Test with real email addresses:
- [ ] Day 3 email delivers correctly
- [ ] One-tap links work
- [ ] Responses recorded in database
- [ ] Notes submission works
- [ ] Red-flag detection triggers appropriately

### 7. Test Autowire
```bash
# Enable autowire in staging
CHECKINS_AUTOWIRE=1
```

- [ ] New assessment automatically enqueues check-ins
- [ ] Purchasers correctly excluded
- [ ] No errors in assessment flow

### 8. Time Window Testing
```bash
# Set restrictive window for testing
CHECKINS_SEND_WINDOW=14:00-14:30  # 30-minute window
```

- [ ] Messages outside window stay queued
- [ ] Messages inside window send correctly
- [ ] DST transitions handled properly

## Production Deployment

### 1. Pre-Production Setup
```bash
# Production environment variables (DigitalOcean)
CHECKINS_ENABLED=0          # Keep OFF initially
CHECKINS_SANDBOX=1          # Keep ON initially
CHECKINS_AUTOWIRE=0         # Keep OFF initially
CHECKINS_TOKEN_SECRET=<production-secret>  # Different from staging!
CHECKINS_SEND_TZ=America/New_York
CHECKINS_SEND_WINDOW=08:00-20:00
CHECKINS_START_AT=2025-01-20T13:00:00Z  # Set future date for safety
```

### 2. Deploy Code
```bash
# Create feature branch
git checkout -b feature/checkins-safe-rollout

# Commit all changes
git add .
git commit -m "feat(checkins): coaching check-ins system (defaults OFF)"

# Push and create PR
git push origin feature/checkins-safe-rollout
```

- [ ] CI passes on PR
- [ ] Code review completed
- [ ] Merge to main

### 3. Database Migration
```sql
-- Run migration in production
-- Verify tables created:
-- - check_in_queue
-- - check_in_responses
-- - message_templates
-- - diagnosis_inserts
-- - encouragements
```

### 4. Content Import (Production)
```bash
# Import content to production
npx tsx scripts/checkins-import.ts --file content/checkins/micro-inserts-prod.csv --dry-run
npx tsx scripts/checkins-import.ts --file content/checkins/micro-inserts-prod.csv
```

### 5. Gradual Enablement

#### Phase 1: Dry Run (Day 1)
```bash
CHECKINS_ENABLED=1
CHECKINS_SANDBOX=1  # Still sandboxed
CHECKINS_START_AT=<tomorrow>  # Delay start
```

- [ ] Monitor logs for composed emails
- [ ] Verify no actual sends
- [ ] Check for any errors

#### Phase 2: Limited Window (Day 2)
```bash
CHECKINS_SANDBOX=0  # Enable sending
CHECKINS_SEND_WINDOW=10:00-11:00  # 1-hour window
CHECKINS_START_AT=  # Remove delay
```

- [ ] Monitor first batch of sends
- [ ] Verify deliverability
- [ ] Check one-tap responses
- [ ] Review any bounce/complaint rates

#### Phase 3: Full Window (Day 3)
```bash
CHECKINS_SEND_WINDOW=08:00-20:00  # Full window
```

- [ ] Monitor throughout the day
- [ ] Check response rates
- [ ] Review any issues

#### Phase 4: Autowire (Day 7)
```bash
CHECKINS_AUTOWIRE=1  # Enable auto-enqueue
```

- [ ] New assessments auto-enqueue
- [ ] Monitor queue growth
- [ ] Verify purchase exclusion works

## Monitoring & Alerts

### Key Metrics to Track
```sql
-- Daily send volume
SELECT
  DATE(sent_at) as date,
  COUNT(*) as emails_sent
FROM check_in_queue
WHERE status = 'sent'
GROUP BY DATE(sent_at);

-- Response rates by day
SELECT
  day,
  COUNT(*) as total_responses,
  AVG(CASE WHEN value = 'better' THEN 1 ELSE 0 END) as better_rate
FROM check_in_responses
GROUP BY day;

-- Failed sends
SELECT COUNT(*) as failed_count
FROM check_in_queue
WHERE status = 'failed'
AND due_at > NOW() - INTERVAL '24 hours';

-- Red flags
SELECT COUNT(*) as red_flags
FROM alerts
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### Alert Thresholds
- Failed send rate > 5%
- Response rate < 10%
- Any red-flag keywords detected
- SendGrid bounce rate > 2%
- Complaint rate > 0.1%

## Rollback Plan

If issues arise:

### Quick Disable (< 30 seconds)
```bash
# In DigitalOcean App Platform
CHECKINS_ENABLED=0  # Stops everything immediately
```

### Sandbox Mode (< 1 minute)
```bash
CHECKINS_SANDBOX=1  # Stops sending, keeps composing
```

### Full Rollback (< 5 minutes)
1. Set `CHECKINS_ENABLED=0`
2. Clear queue if needed:
   ```sql
   UPDATE check_in_queue
   SET status = 'cancelled'
   WHERE status = 'queued';
   ```
3. Investigate issues
4. Fix and re-deploy

## Success Criteria

Week 1:
- [ ] < 1% failure rate
- [ ] > 15% response rate
- [ ] No critical bugs
- [ ] No spam complaints

Week 2:
- [ ] > 20% response rate
- [ ] Positive user feedback
- [ ] Revenue attribution working
- [ ] Brad approves to continue

Month 1:
- [ ] Stable operation
- [ ] Clear ROI metrics
- [ ] Ready for optimization

## Contacts

- **Technical Issues**: DevOps team
- **Content Issues**: Brad
- **Email Deliverability**: SendGrid support
- **Emergency**: On-call engineer

## Verification

### Admin Routes

#### Test Coverage Check
```bash
# Check for missing inserts and templates
curl -X GET https://localhost:3000/api/admin/checkins/coverage \
  -H "Cookie: admin_auth_token=<token>"

# Should return:
# { "missingInserts": [], "missingTemplates": [] }
```

#### Test Red-Flag Webhook
```bash
# Send test webhook (requires ALERT_WEBHOOK env var)
curl -X POST https://localhost:3000/api/admin/checkins/test/red-flag \
  -H "Cookie: admin_auth_token=<token>"

# Should return:
# { "ok": true }
```

## Post-Launch Tasks

- [ ] Document actual response rates
- [ ] Optimize send times based on engagement
- [ ] A/B test email templates
- [ ] Consider SMS channel addition
- [ ] Build reporting dashboard
- [ ] Set up automated monitoring