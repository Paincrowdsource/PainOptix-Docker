# Coaching Check-Ins Guide (Claude Agent)
Updated: 2025-09-19

## Read This First
- PainOptix is educational-only. Never generate diagnoses, prescriptions, or treatment instructions.
- Phase 1 forbids LLM-generated copy. All emails are deterministic templates assembled from vetted snippets.
- The 16-question assessment, guide delivery, and Stripe upgrades already run in production. Extend them; do not replace them.
- PDF and Stripe catalog rules are out of scope. Open a new change request before editing those subsystems.

## Scope of the Subsystem
- Audience: users who finished the quiz, consented to contact, and have **not** purchased the $20 Monograph.
- Messages: Day 3, 7, and 14 follow-up emails (SMS later behind a flag).
- Rendering: `shell` + `diagnosis insert` + `encouragement` + CTA + disclaimer. All strings come from Supabase tables seeded via scripts.
- Outcomes: one-tap Better / Same / Worse. Optional note with static red-flag handling and internal alerting.
- Attribution: append `source=checkin_d{day}` metadata to CTA links and Stripe sessions; persist in `revenue_events`.

## Non-Negotiables (SaMD & Safety)
- Include the standard educational disclaimer on **every** message and outcome page.
- Keep logs PII-free. Use structured JSON (env, request_id, event, level, latency_ms, identifiers hashed or truncated).
- Red-flag path is static keywords only. Match list lives in code; response is a prewritten safety message plus an alert row.
- Tokens for one-tap links must be single-use, signed, and scoped to `(assessment_id, day, branch)`.

## Architecture Contracts
- **Database**: Supabase/Postgres. Tables (`message_templates`, `diagnosis_inserts`, `encouragements`, `check_in_queue`, `check_in_responses`, `revenue_events`, `alerts`) created via migration `2025-09-14_checkins.sql`. RLS = service-role only.
- **API Routes**: Next.js App Router under `app/api/checkins/*` plus the user-facing `app/c/i/route.ts` for outcomes.
- **Email**: SendGrid (API key in env). SMS deferred; keep channel checks ready.
- **Scheduler**: DigitalOcean App Platform job calling `POST /api/checkins/dispatch` with `CHECKINS_DISPATCH_TOKEN` header.
- **Feature Flags**: `CHECKINS_ENABLED`, `CHECKINS_SANDBOX`, `CHECKINS_AUTOWIRE`, `CHECKINS_START_AT`.
- **Time Zones**: store `due_at` in UTC. Dispatcher honours `CHECKINS_SEND_TZ` (America/New_York) and quiet window `CHECKINS_SEND_WINDOW` (e.g., 08:00-20:00).

## API Summary
1. `POST /api/checkins/enqueue`
   - Triggered on assessment completion or reconciliation job.
   - Creates Day 3/7/14 rows when no $20 purchase exists. Idempotent via `(assessment_id, day)` unique constraint.
2. `POST /api/checkins/dispatch`
   - Cron endpoint that selects due rows, renders templates, sends email, and updates status.
   - Retries with exponential backoff; skips if purchase detected at send time.
3. `GET /c/i`
   - One-tap outcome endpoint (`d`=3|7|14, `v`=better|same|worse, `token` signed).
   - Records response and redirects to thin CTA page with UTM/source tagging.
4. `POST /api/checkins/ack`
   - Accepts optional note. Stores note (trim to 280 chars), runs red-flag matcher, inserts `alerts` row when matched, and returns static safety message.
5. `GET /api/admin/checkins`
   - Admin JSON for dashboards (due, sent, failed, responses, revenue). Drives the Check-Ins tab UI.

## Logging & Monitoring
- Emit events: `enqueue_created`, `dispatch_attempt`, `dispatch_result`, `outcome_recorded`, `red_flag_alert`, `retry_scheduled`.
- Forward errors to Sentry; keep secrets out of messages.
- Admin tables must reconcile with logs (counts and statuses should match).

## Deliverables Checklist
- Migration applied; seeds inserted; validator for forbidden phrases (`diagnose`, `prescribe`, `dosage`, `take`, `should do`) passes.
- Enqueue + dispatch endpoints covered by unit tests (`lib/checkins/*.test.ts`).
- SendGrid integration tested in staging with sandbox/API key.
- Check-in CTA flows attribute to Stripe (monograph purchase shows `source=checkin_dX`).
- Admin Check-Ins view exposes counts, revenue, and retry actions consistent with existing communications UI.
- Feature flags default safe (`CHECKINS_ENABLED=0`, `CHECKINS_SANDBOX=1`, `CHECKINS_AUTOWIRE=0`).

## References
- Technical spec: `docs/checkins/SPEC.md`.
- Implementation backlog: `docs/checkins/TODO.md`.
- Rollout steps: `docs/checkins/rollout.md`, `docs/checkins/step-2-dispatch.md`.
- Templates & content: Supabase tables seeded via `scripts/checkins-import.ts`.

Update this guide whenever behaviour or guardrails change. If written instructions clash with code/tests, fix the documentation within the same pull request.
