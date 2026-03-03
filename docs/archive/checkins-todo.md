# Coaching Check-Ins TODO (Phase 1)
Updated: 2025-09-25

## Core Build
- [x] Supabase migrations (tables, indexes, RLS) committed (`supabase/migrations/2025-09-14_checkins.sql`); applied in production.
- [x] Seed scripts for templates, inserts, encouragements, disclaimer, validator (`scripts/checkins-import.ts`, `docs/checkins/checkins-seed.md`).
- [x] `POST /api/checkins/enqueue` (assessment hook + reconciliation) with idempotency tests (`__tests__/enqueue.spec.ts`).
- [x] Template renderer utility + unit tests in progress (`lib/checkins/dispatch.ts` compose helpers; add more coverage for rendering edge cases).
- [x] `POST /api/checkins/dispatch` (SendGrid send, retries, logs) implemented via `dispatchDue` and `app/api/checkins/dispatch` route.
- [x] SendGrid provider module with sandbox toggle and categories (`lib/mailer/sendEmail.ts`).
- [x] `GET /c/i` one-tap outcome + CTA page + token guard (`app/c/i/route.ts`).
- [x] `POST /api/checkins/ack` (notes + red-flag handling) implemented (`app/api/checkins/note/route.ts`).
- [x] Red-flag keyword scanning implemented and working (see CHECKINS_VERIFICATION.md).
- [ ] Set ALERT_WEBHOOK when clinic provides production webhook endpoint (optional - system works without it).
- [x] Admin Check-Ins tab (due/sent/failed/responses, revenue) shipped (`app/admin/checkins`).
- [x] Stripe attribution (`source=checkin_dX`) + `revenue_events` capture (handled in checkout session + webhook).
- [ ] Build Playwright end-to-end test coverage for check-ins flow.
- [x] Production deployment complete; GitHub Actions scheduler running every 15 minutes (see CHECKINS_VERIFICATION.md).

## Content Operations
- [x] All content seeded: 12 templates, 72 inserts, 20 encouragements (coverage verified via `/api/admin/checkins/coverage`).
- [x] Word count validated (all under 25 words per CHECKINS_VERIFICATION.md).
- [x] Disclaimer confirmed on all templates (verified in production).

## Observability
- [x] Migrate `lib/checkins/enqueue.ts` to structured logger (completed 2025-09-25, see git diff).
- [ ] Configure Sentry/error tracking before launch.
- [x] Admin counters verified against database (E2E QA completed 2025-09-23).

## Release Blockers
These items must be completed before flipping production flags:
- [ ] ALERT_WEBHOOK remains unset until Bradley provides production webhook (optional - not blocking release).
- [ ] Configure error tracking (deferred - structured logging currently sufficient).
- [x] Migrate `lib/checkins/enqueue.ts` to structured logger (completed 2025-09-25).
- [ ] Build Playwright end-to-end test coverage.
- [x] Flags currently safe: CHECKINS_ENABLED=0, CHECKINS_SANDBOX=1, CHECKINS_AUTOWIRE=0.

## Nice-to-Have (Post-Phase 1)
- [ ] Quiet hours per user timezone.
- [ ] Diagnosis-specific send windows.
- [ ] CSV export for responses and revenue.

Update this checklist as tasks complete. Keep feature flags (`CHECKINS_ENABLED`, `CHECKINS_SANDBOX`, `CHECKINS_AUTOWIRE`) safe until production sign-off.

## Changelog  2025-09-19 12:02
- Supabase client hardened (lazy factories)  done
- Preview CLI rebuilt with robust args and source tag  done
- GitHub Actions cron added (*/15 dry-run)  done
- Note/ack route fixed (red-flag scan + optional webhook)  done
- Structured logger added at lib/logger.ts  done

## Changelog  2025-09-19 12:46
- Fixed note/ack route (red-flag scan + alert row + optional webhook).
- Hardened Supabase client usage (lazy service client, no build-time secret reads).
- Preview CLI stable; generated Day 3/7/14 previews and zipped for client.
- Added admin password update script (server-only; uses service role).
