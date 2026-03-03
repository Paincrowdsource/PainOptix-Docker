# Check-Ins: Step 2 & 3 - Complete System

## Overview
This step implements the enqueue, dispatcher, and one-tap response functionality for the coaching check-ins feature. Everything defaults to safe/dry-run mode.

## Safety Flags

The system respects these environment variables:

- `CHECKINS_ENABLED=0` - Master switch (must be `1` to enable any functionality)
- `CHECKINS_SANDBOX=1` - When `1`, composes emails but doesn't send them
- `CHECKINS_FROM_EMAIL` - From address for check-in emails
- `CHECKINS_TOKEN_SECRET` - Secret for HMAC signing of one-tap links (required)
- `CHECKINS_SEND_TZ` - Timezone for send window (default: America/New_York)
- `CHECKINS_SEND_WINDOW` - Send window in HH:MM-HH:MM format (e.g., 08:00-20:00)
- `CHECKINS_START_AT` - ISO date to start sending (skip all before this date)
- `NEXT_PUBLIC_APP_URL` - Base URL for generating links

## API Endpoints

### 1. Enqueue Check-Ins

Adds an assessment to the check-in queue (days 3, 7, 14).

```bash
# Using service role key (dev/staging)
curl -X POST https://localhost:3000/api/checkins/enqueue \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"assessment_id":"<uuid>"}'

# Using admin password (if configured)
curl -X POST https://localhost:3000/api/checkins/enqueue \
  -H "x-admin-password: $ADMIN_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{"assessment_id":"<uuid>"}'
```

**Response:**
```json
{
  "created": 3,
  "skippedReason": null
}
```

Possible `skippedReason` values:
- `"disabled"` - CHECKINS_ENABLED is not 1
- `"purchased"` - User has made a purchase
- `"no_contact"` - No email or phone available
- `"assessment_not_found"` - Invalid assessment ID

### 2. Dispatch Due Messages

Processes and sends all due check-in messages.

```bash
# Dry-run mode (compose but don't send)
curl -X POST "https://localhost:3000/api/checkins/dispatch?dryRun=1" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"

# Normal dispatch (respects CHECKINS_SANDBOX)
curl -X POST https://localhost:3000/api/checkins/dispatch \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -d '{"limit": 100}'
```

**Response:**
```json
{
  "success": true,
  "queued": 5,
  "sent": 3,
  "skipped": 1,
  "failed": 1,
  "errors": ["Send failed for xxx: Invalid email"]
}
```

### 3. One-Tap Response (Public)

Records user's check-in response via one-tap link.

```
GET /c/i?token=<signed-token>
```

The token encodes:
- `assessment_id` - Which assessment this relates to
- `day` - Which day (3, 7, or 14)
- `value` - User's response (better, same, worse)
- `exp` - Expiration timestamp

## Content Import

Import diagnosis-specific micro-inserts using the content importer:

```bash
# Dry-run to validate content
npx tsx scripts/checkins-import.ts --file content/checkins/micro-inserts.csv --dry-run

# Import for real
npx tsx scripts/checkins-import.ts --file content/checkins/micro-inserts.csv
```

Content requirements:
- Max 25 words per insert
- Max 300 rows per file
- No forbidden medical phrases
- See `docs/checkins/content-format.md` for full details

## HTML Preview

Generate HTML previews of check-in emails without sending:

```bash
npx tsx scripts/checkins-preview.ts --assessment <uuid> --day 7 --branch initial

# Output saved to tmp/preview-day7-initial.html
```

## Send Window & Start Date

The dispatcher respects time-based guardrails:

1. **Send Window**: Messages only sent during specified hours in target timezone
   - Set `CHECKINS_SEND_TZ=America/New_York`
   - Set `CHECKINS_SEND_WINDOW=08:00-20:00`
   - Messages outside window remain queued (not skipped)
   - DST-aware using date-fns-tz

2. **Start Date**: Delay all sends until a specific date
   - Set `CHECKINS_START_AT=2025-01-20T00:00:00Z`
   - Messages before this date remain queued
   - Useful for staged rollouts

## Testing Flow

### 1. Set up environment

```bash
# Add to .env.local
CHECKINS_ENABLED=1
CHECKINS_SANDBOX=1  # Keep as 1 for testing
CHECKINS_FROM_EMAIL=no-reply@painoptix.com
CHECKINS_TOKEN_SECRET=your-random-32-char-secret-here
CHECKINS_SEND_TZ=America/New_York
CHECKINS_SEND_WINDOW=08:00-20:00
CHECKINS_START_AT=  # Leave empty for immediate sending
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Apply migration and seed data

```sql
-- Run in Supabase SQL editor
-- Paste contents of supabase/migrations/2025-09-14_checkins.sql
```

```bash
# Run seed script
npx ts-node scripts/seed-checkins.ts
```

### 3. Create test assessment

Create an assessment through the normal flow or directly in the database:

```sql
-- Create test assessment
INSERT INTO assessments (id, email, diagnosis_code, created_at)
VALUES (
  gen_random_uuid(),
  'test@example.com',
  'sciatica',
  NOW() - INTERVAL '1 day'
);
```

### 4. Enqueue check-ins

```bash
# Get the assessment ID from above, then:
curl -X POST http://localhost:3000/api/checkins/enqueue \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"assessment_id":"YOUR_ASSESSMENT_ID"}'
```

### 5. Test dry-run dispatch

```bash
curl -X POST "http://localhost:3000/api/checkins/dispatch?dryRun=1" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Check server logs for composed email details.

### 6. Test one-tap link

1. Copy a token URL from the dry-run logs
2. Open in browser: `http://localhost:3000/c/i?token=...`
3. Verify the response page renders correctly
4. Check database for recorded response:

```sql
SELECT * FROM check_in_responses
WHERE assessment_id = 'YOUR_ASSESSMENT_ID';
```

## Production Deployment

### Before going live:

1. **Generate secure token secret:**
   ```bash
   openssl rand -hex 32
   ```

2. **Set production environment variables in DigitalOcean:**
   - `CHECKINS_ENABLED=0` (keep OFF until ready)
   - `CHECKINS_SANDBOX=1` (keep ON for initial production testing)
   - `CHECKINS_TOKEN_SECRET=<generated-secret>`
   - `CHECKINS_FROM_EMAIL=no-reply@painoptix.com`

3. **Test in production with sandbox mode:**
   - Deploy with `CHECKINS_SANDBOX=1`
   - Run test enqueue/dispatch
   - Verify logs show correct email composition

4. **Enable gradually:**
   - Set `CHECKINS_ENABLED=1` with `CHECKINS_SANDBOX=1`
   - Test with real assessment
   - When confident, set `CHECKINS_SANDBOX=0`

## Database Tables Used

- `check_in_queue` - Stores scheduled messages
- `check_in_responses` - Records user responses
- `message_templates` - Email templates
- `diagnosis_inserts` - Diagnosis-specific content
- `encouragements` - Rotating encouragement messages
- `purchases` - Checked to suppress check-ins for purchasers

## Security Notes

- All write operations use service role (bypass RLS)
- One-tap tokens are HMAC-signed with expiration
- No PII logged (emails are hashed in logs)
- Idempotent operations prevent duplicates
- Admin endpoints require authentication

## Monitoring

Check these for issues:

```sql
-- Failed sends
SELECT * FROM check_in_queue
WHERE status = 'failed'
ORDER BY due_at DESC;

-- Response rates
SELECT
  day,
  COUNT(*) as responses,
  COUNT(CASE WHEN value = 'better' THEN 1 END) as better,
  COUNT(CASE WHEN value = 'same' THEN 1 END) as same,
  COUNT(CASE WHEN value = 'worse' THEN 1 END) as worse
FROM check_in_responses
GROUP BY day;
```

## Step 3 - Additional Features

### Admin UI
Access the Check-Ins dashboard at `/admin/checkins`:
- View real-time stats (due now, sent, failed, responses, revenue)
- Filter queue by day, status, channel
- Manual dispatch controls (dry-run and live)
- Response analytics by day and outcome
- Revenue attribution tracking

### Notes + Red-Flag Detection
After clicking a one-tap response, users can optionally submit a note:
- 280 character limit
- Red-flag keywords trigger alerts
- Static safety messages for concerning symptoms
- No LLM calls - fully deterministic

Red-flag keywords are defined in `docs/checkins/red-flags.yml`

### Revenue Attribution
Purchases made from check-in CTAs are tracked:
- Source tags: `checkin_d3`, `checkin_d7`, `checkin_d14`
- Stored in `revenue_events` table
- Visible in admin dashboard
- Stripe metadata includes source

### Autowire Feature
When `CHECKINS_AUTOWIRE=1`, check-ins are automatically enqueued after assessment completion:
- Only for non-purchasers
- Requires email address
- Respects `CHECKINS_ENABLED` flag
- Silent failure (doesn't break assessment flow)

To enable:
```bash
CHECKINS_ENABLED=1
CHECKINS_AUTOWIRE=1
```

## Environment Variables

```bash
# Core flags
CHECKINS_ENABLED=0          # Master switch (0=off, 1=on)
CHECKINS_SANDBOX=1          # Sandbox mode (0=send, 1=log only)
CHECKINS_AUTOWIRE=0         # Auto-enqueue on assessment (0=off, 1=on)

# Configuration
CHECKINS_FROM_EMAIL=no-reply@painoptix.com
CHECKINS_TOKEN_SECRET=<32-char-secret>
NEXT_PUBLIC_APP_URL=https://painoptix.com
```

## Troubleshooting

**No emails sending:**
- Check `CHECKINS_ENABLED=1`
- Check `CHECKINS_SANDBOX=0`
- Verify `SENDGRID_API_KEY` is set
- Check server logs for errors

**Invalid token errors:**
- Verify `CHECKINS_TOKEN_SECRET` is set
- Check token hasn't expired (7 days TTL)
- Ensure `NEXT_PUBLIC_APP_URL` matches production

**Duplicate emails:**
- This shouldn't happen due to unique constraints
- Check `check_in_queue` for duplicate entries
- Verify idempotency key in enqueue logic

**Autowire not working:**
- Check both `CHECKINS_ENABLED=1` and `CHECKINS_AUTOWIRE=1`
- Verify assessment has email address
- Check logs for enqueue errors
- Ensure no purchases exist for assessment

**Red-flag alerts not triggering:**
- Check keywords in `docs/checkins/red-flags.yml`
- Verify note submission endpoint is working
- Check `alerts` table for entries
- Review server logs for errors