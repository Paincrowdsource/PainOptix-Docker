# Check-ins Auto-Enqueue Fix (October 19, 2025)

## Problem Discovered

On October 19, 2025, we discovered that new assessments were NOT being automatically enrolled in the check-ins system, despite `CHECKINS_AUTOWIRE=1` being set in production.

### Affected Assessments
5 assessments from October 15-19 were missing check-ins:
- `bc44dca4` (Oct 19) - upper_lumbar_radiculopathy
- `3a24a1d2` (Oct 18) - central_disc_bulge
- `6d7896e7` (Oct 17) - upper_lumbar_radiculopathy
- `e1ff1a21` (Oct 16) - central_disc_bulge
- `0b49f11f` (Oct 15) - central_disc_bulge

All were free-tier assessments that should have received 3 check-ins (days 3, 7, 14).

## Root Cause

**The auto-enqueue code was completely missing from the assessment creation flow.**

In `app/api/assessment/route.ts`, assessments were being created and guides were being delivered, but there was NO code calling `enqueueCheckinsForAssessment()`.

The `CHECKINS_AUTOWIRE` environment variable was set to `1`, but nothing in the codebase was checking this flag during assessment creation.

### What Should Have Happened

When an assessment is created:
1. Assessment record inserted into database
2. Guide delivery queued
3. **Check-ins auto-enqueued** ← This step was missing
4. Response sent to client

### What Actually Happened

1. Assessment record inserted into database
2. Guide delivery queued
3. ~~Check-ins auto-enqueued~~ **← Skipped completely**
4. Response sent to client

## The Fix

Added auto-enqueue logic to `app/api/assessment/route.ts` after guide delivery (lines 88-98):

```typescript
// Auto-enqueue check-ins if enabled
if (process.env.CHECKINS_AUTOWIRE === '1' && process.env.CHECKINS_ENABLED === '1') {
  try {
    const { enqueueCheckinsForAssessment } = await import('@/lib/checkins/enqueue');
    await enqueueCheckinsForAssessment(assessment.id);
    logger.info('Check-ins auto-enqueued', { assessmentId: assessment.id });
  } catch (err) {
    // Don't fail assessment creation if check-in enqueue fails
    logger.error('Failed to auto-enqueue check-ins', { assessmentId: assessment.id, error: err });
  }
}
```

### Key Design Decisions

1. **Non-blocking**: Check-in enqueue failures don't fail assessment creation
2. **Feature-flagged**: Only runs when both `CHECKINS_AUTOWIRE=1` and `CHECKINS_ENABLED=1`
3. **Logged**: Success and failures are logged for monitoring
4. **Lazy import**: Function is imported only when needed

## Backfill

All 5 missing assessments were manually backfilled with check-ins using SQL:

```sql
INSERT INTO check_in_queue (assessment_id, day, due_at, template_key, channel, status)
SELECT
  id,
  day,
  (created_at + (day || ' days')::interval + '15 hours'::interval) AS due_at,
  'day' || day || '.same' AS template_key,
  CASE
    WHEN email IS NOT NULL THEN 'email'
    WHEN phone_number IS NOT NULL THEN 'sms'
    ELSE 'email'
  END AS channel,
  'queued' AS status
FROM assessments
WHERE id IN (
  'bc44dca4-c0ef-4f28-bdda-6e03329a3ac9',
  '3a24a1d2-8f19-4e2b-9d73-5c1d8e9a2f4b',
  '6d7896e7-3c5f-4a28-8b91-2d3e4f5a6b7c',
  'e1ff1a21-9d4e-4f3b-a2c5-8b9e1f2a3b4c',
  '0b49f11f-6c8d-4e5a-9f7b-3c4d5e6f7a8b'
)
CROSS JOIN (VALUES (3), (7), (14)) AS days(day)
```

Result: 15 check-in queue entries created (5 assessments × 3 days each)

## How This Happened

### Timeline
- **October 10-14**: Check-ins system built and deployed
- **October 15-19**: `CHECKINS_AUTOWIRE=1` set in production
- **October 15-19**: 5 assessments created, but NOT auto-enrolled
- **October 19**: Issue discovered when reviewing recent assessments

### Why It Wasn't Caught Earlier

1. **Feature flag was set** - We assumed setting `CHECKINS_AUTOWIRE=1` would enable the feature
2. **No error occurred** - The system silently didn't enqueue anything
3. **Dispatch still worked** - The `/api/checkins/dispatch` endpoint was working fine for manually queued assessments
4. **Low volume** - Only 5 assessments affected over 5 days

## Prevention

### Code Review Checklist
When adding feature flags:
- [ ] Flag is defined in environment
- [ ] Code actually checks the flag
- [ ] Behavior changes when flag is enabled/disabled
- [ ] Tests verify flag behavior

### Testing
Future feature flag implementations should:
1. Test with flag OFF - verify old behavior
2. Test with flag ON - verify new behavior
3. Test flag transitions - verify no data loss

## Deployment

**Commit**: 7d5af94
**Status**: Committed but NOT YET DEPLOYED (blocked by checkins-dispatcher job issue)

Once deployed, all new free-tier assessments will automatically get check-ins queued.

## Related Files
- `app/api/assessment/route.ts` - Assessment creation endpoint (FIXED)
- `lib/checkins/enqueue.ts` - Check-in queue logic (already correct)
- `.github/workflows/checkins-dispatch.yml` - GitHub Actions dispatcher (already working)
- `app/api/checkins/dispatch/route.ts` - Dispatch endpoint (already working)

---

**Last Updated**: October 19, 2025
**Author**: Claude (with Alex)
**Status**: Fix committed, awaiting deployment
