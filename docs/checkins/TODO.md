# Coaching Check-Ins TODO (Phase 1)
Updated: 2025-09-19

## Core Build
- [x] Supabase migrations (tables, indexes, RLS) committed (`supabase/migrations/2025-09-14_checkins.sql`); confirm applied in each env.
- [x] Seed scripts for templates, inserts, encouragements, disclaimer, validator (`scripts/checkins-import.ts`, `docs/checkins/checkins-seed.md`).
- [x] `POST /api/checkins/enqueue` (assessment hook + reconciliation) with idempotency tests (`__tests__/enqueue.spec.ts`).
- [x] Template renderer utility + unit tests in progress (`lib/checkins/dispatch.ts` compose helpers; add more coverage for rendering edge cases).
- [x] `POST /api/checkins/dispatch` (SendGrid send, retries, logs) implemented via `dispatchDue` and `app/api/checkins/dispatch` route.
- [x] SendGrid provider module with sandbox toggle and categories (`lib/mailer/sendEmail.ts`).
- [x] `GET /c/i` one-tap outcome + CTA page + token guard (`app/c/i/route.ts`).
- [x] `POST /api/checkins/ack` (notes + red-flag handling) implemented (`app/api/checkins/note/route.ts`).
- [ ] Red-flag keyword list + alert webhook integration (keyword list live; external alert webhook not yet wired).
- [x] Admin Check-Ins tab (due/sent/failed/responses, revenue) shipped (`app/admin/checkins`).
- [x] Stripe attribution (`source=checkin_dX`) + `revenue_events` capture (handled in checkout session + webhook).
- [ ] End-to-end tests (happy path, retries, idempotency, timezone, red-flag) pending Playwright coverage.
- [ ] Staging bake, production deploy, flags toggled appropriately (DigitalOcean deploy currently failing on missing Supabase key).

## Content Operations
- [ ] Import client-supplied 81 diagnosis inserts (CSV staged at `content/checkins/micro-inserts.client.v1.csv`; confirm Supabase seed run).
- [ ] Validate word count (<=25) and tone (educational only) against final copy sign-off.
- [ ] Confirm disclaimer appended to every template (double-check seeded `message_templates`).

## Observability
- [ ] Structured logs emitted for enqueue, dispatch, outcome, red-flag (console statements exist; migrate to structured logger + masking).
- [ ] Sentry wired for errors; red-flag alert webhook tested.
- [ ] Admin counters match database metrics (run reconciliation script once staging data flows).

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
