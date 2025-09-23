# Check-ins Rollout Checklist

## Pre-Launch Verification ✅

### 1. Database & Content
- [x] All migrations applied (`2025-09-14_checkins.sql`)
- [x] Content imported:
  - 72 diagnosis_inserts
  - 10 message_templates
  - 10 encouragements
- [x] Queue items present (3 test items)

### 2. Configuration
- [x] `CHECKINS_TOKEN_SECRET` configured (verified in .env.local.checkins)
- [x] `CHECKINS_DISPATCH_TOKEN` configured (verified in .env.local.checkins)
- [x] SendGrid API key configured
- [ ] `ALERT_WEBHOOK` configured (optional for red-flag notifications)

### 3. Code Changes Applied
- [x] Admin dispatch proxy (`/api/admin/checkins/dispatch`)
- [x] Red-flag loader from YAML (`lib/checkins/redFlags.ts`)
- [x] Structured logging in dispatch and note endpoints
- [x] Health check endpoint (`/api/admin/checkins/health`)
- [x] Admin UI updates (removed x-admin-password usage)

## Rollout Phases 🚀

### Phase 1: Dry Run Testing (Current State)
```env
CHECKINS_ENABLED=0
CHECKINS_SANDBOX=1
CHECKINS_AUTOWIRE=0
```

**Actions:**
1. Access admin UI: `/admin/checkins`
2. Check Health Status panel - should show "Configuration Required"
3. Use Manual Trigger to queue a test message
4. Click "Dispatch (Dry Run)" button
5. Verify logs show "would send" messages
6. No actual emails should be sent

### Phase 2: Sandbox Mode Active
```env
CHECKINS_ENABLED=1    # Enable the system
CHECKINS_SANDBOX=1    # Keep in sandbox mode
CHECKINS_AUTOWIRE=0   # Don't auto-enqueue
```

**Actions:**
1. Health Status should show "System Healthy" with sandbox warning
2. Use Manual Trigger to queue messages
3. Dispatch will log but not send emails
4. Test one-tap outcome links manually
5. Verify red-flag detection with test notes

### Phase 3: Live Testing (Limited)
```env
CHECKINS_ENABLED=1
CHECKINS_SANDBOX=0    # Go live!
CHECKINS_AUTOWIRE=0   # Still manual
CHECKINS_RECIPIENT_ALLOWLIST=test@example.com,admin@example.com  # Optional safety
```

**Actions:**
1. Queue messages for test accounts only
2. Dispatch will send real emails to allowlisted addresses
3. Test full flow: email → one-tap → note → red-flag
4. Monitor logs for errors
5. Check revenue attribution

### Phase 4: Full Production
```env
CHECKINS_ENABLED=1
CHECKINS_SANDBOX=0
CHECKINS_AUTOWIRE=1   # Auto-enqueue on assessment completion
CHECKINS_START_AT=2025-09-25  # Optional start date
CHECKINS_SEND_TZ=America/New_York
CHECKINS_SEND_WINDOW=08:00-20:00
```

**Actions:**
1. All new assessments auto-enqueue
2. Cron job calls `/api/checkins/dispatch` every hour
3. Respects send window (8am-8pm EST)
4. Monitor Health Status panel
5. Review Analytics tab for performance

## Monitoring & Validation 📊

### Health Check Indicators
- **Green (Healthy)**: System configured, < 10 failed messages
- **Yellow (Degraded)**: > 10 failed messages, investigate
- **Red (Not Ready)**: Missing configuration

### Key Metrics to Watch
1. **Queue Health**:
   - Due Now count should decrease after dispatch
   - Failed count should stay low (< 5%)

2. **Response Rates**:
   - Target: 20-30% response rate
   - Monitor "Feeling Worse" count for urgency

3. **Revenue Attribution**:
   - Check Revenue tab for check-in sourced purchases
   - Verify source=checkin_d{day} in Stripe metadata

### Log Events to Monitor
```
dispatch_start         - Dispatch initiated
dispatch_sent          - Message sent successfully
dispatch_send_error    - Send failure (investigate)
dispatch_complete      - Batch complete with summary
checkins_ack          - Note received
red_flag_alert_insert - Red flag detected
```

## Rollback Procedure 🔄

If issues arise, disable immediately:
```env
CHECKINS_ENABLED=0
```

This stops:
- New messages from being queued
- Dispatcher from sending emails
- But preserves all data and allows investigation

## Admin Tools 🛠️

### Manual Controls
- **Queue Individual**: Manual Trigger tab
- **Dispatch Dry Run**: Test without sending
- **Dispatch Now**: Send all due messages
- **Export Responses**: Download CSV for analysis

### Health Monitoring
- `/api/admin/checkins/health` - JSON status
- Admin UI Overview tab - Visual health panel
- Updates every 30 seconds automatically

## Common Issues & Solutions 🔧

### No Emails Sending
1. Check `CHECKINS_SANDBOX=0` (must be 0 for live)
2. Verify SendGrid API key is valid
3. Check send window constraints
4. Review dispatch logs for errors

### Low Response Rates
1. Verify one-tap links work (`/c/i` endpoint)
2. Check if emails reach inbox (not spam)
3. Review message content engagement
4. Consider A/B testing templates

### Red Flags Not Alerting
1. Verify `docs/checkins/red-flags.yml` exists
2. Check `ALERT_WEBHOOK` if using external alerts
3. Review `alerts` table for inserted records
4. Check logs for `red_flag_alert_insert_error`

## Final Checklist Before Go-Live ✓

- [ ] Health Status shows all green checks
- [ ] Dry run dispatch shows expected message count
- [ ] Test email received and links work
- [ ] Note submission updates database
- [ ] Red flag test triggers alert
- [ ] Revenue attribution verified in Stripe
- [ ] Team briefed on monitoring procedure
- [ ] Rollback procedure documented and tested

---

**Support Contact**: If issues arise, check logs first, then contact tech lead.

**Last Updated**: 2025-09-23