# Coaching Check-Ins Technical Spec (Phase 1: Deterministic)
Updated: 2025-09-19

## 1. Objective
Re-engage quiz finishers who did not purchase with short Day 3/7/14 coaching emails. Each message is assembled from vetted blocks (shell + diagnosis insert + encouragement + CTA + disclaimer), collects a one-tap outcome (Better / Same / Worse), logs responses, and attributes downstream purchases. All copy remains educational, red-flag handling is static, and the build extends existing production rails (assessment -> contact capture -> Stripe -> 14-day follow-up).

## 2. Scope (Phase 1)
- Scheduler and dispatcher for Day 3/7/14 emails to non-purchasers (SendGrid; secrets via DigitalOcean env).
- Deterministic template engine with placeholders `{{insert}}` and `{{encouragement}}`.
- Outcome router with one-tap links and optional notes.
- Red-flag keyword scan with static safety response + internal alert.
- Attribution tagged as `source=checkin_d{day}` surfaced in Admin; Stripe webhook already live.
- Light Admin table listing queue status, outcomes, conversions, and retry action.

## 3. Out of Scope
- Free-form chat, RAG, or LLM text generation.
- 30-day curriculum or daily lessons.
- A/B testing and advanced dashboards.
- Changes to the PDF pipeline.

## 4. Dependencies & Conventions
- Production endpoints already in use: `/api/assessment`, `/api/stripe/webhook`, `/api/health`, communications sender.
- Existing flow: email/SMS captured before results; 14-day follow-up active; we add Day 3/7/14.
- Stripe products include Monograph ($20); webhook is reliable.
- Deployment via DigitalOcean App Platform using Docker image and env secrets.

## 5. User Stories
- Non-purchasing finisher receives helpful Day 3 email with Better/Same/Worse one-tap choice.
- "Worse" branch promotes Monograph + consult, plus disclaimer.
- Red-flag note triggers static safety message and internal alert.
- Admin monitors due/sent/errors/responses/conversions and retries failures.

## 6. Data Model (Supabase, RLS)
Tables (service-role access only):
- `message_templates`
- `diagnosis_inserts`
- `encouragements`
- `check_in_queue`
- `check_in_responses`
- `revenue_events`
- `alerts`

Indexes: `check_in_queue(due_at)`, `(assessment_id, day)`; `check_in_responses(assessment_id, day)`; `revenue_events(assessment_id)` and `(created_at)`. Enable RLS on all tables with server role policies only.

## 7. Message Composition Rules
- Shell per day/branch includes `{{insert}}` and `{{encouragement}}` placeholders.
- Diagnosis insert: <=25 words; keyed by diagnosis + day + branch.
- Encouragement: rotating short lines.
- CTA: Monograph link; consult link on Worse branch.
- Disclaimer appended to every message.

## 8. API Endpoints
- `POST /api/checkins/enqueue`: create Day 3/7/14 queue rows on assessment completion when no purchase exists.
- `POST /api/checkins/dispatch`: internal job renders and sends messages, updates status, retries safely.
- `GET /c/i`: outcome endpoint capturing Better/Same/Worse via signed token, forwarding to CTA page with UTM/source.
- `POST /api/checkins/ack`: optional note submission, red-flag scan, static response, alert insertion.
- `GET /api/admin/checkins`: admin data feed.

## 9. Red-Flag Handling
Maintain keyword list (e.g., bladder, bowel, progressive weakness, saddle anesthesia). On match: show static safety message, insert alert row, no LLM.

## 10. Attribution & Admin
- Add `source=checkin_d{day}` metadata to Stripe purchases; populate `revenue_events` on webhook.
- Admin Check-Ins table mirrors existing communications UI with retry button.

## 11. Environment & Secrets (DigitalOcean)
- DB: `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Email: `SENDGRID_API_KEY`.
- App: `NEXT_PUBLIC_APP_URL`.
- Flags: `CHECKINS_ENABLED`, `CHECKINS_SANDBOX`, `CHECKINS_AUTOWIRE`, `CHECKINS_START_AT`, `CHECKINS_DISPATCH_TOKEN`.

## 12. Logging, Monitoring, Testing
- Structured JSON logs (no PII) with `req_id`, `event`, `latency_ms`.
- Tests cover enqueue, dispatch (including retry), outcome logging, red-flag path, and Stripe attribution.
- SaMD validator scans templates for forbidden phrases (diagnose, prescribe, dosage, take, should do).

## 13. Acceptance Criteria
- Day 3/7/14 emails send to eligible users; statuses tracked with retries; purchases suppress future sends.
- Messages render shell + insert + encouragement + CTA + disclaimer.
- Outcomes stored; CTA pages correct with UTM/source; tokens single-use.
- Red-flag handling produces static message + alert.
- Admin shows due/sent/errors/responses/conversions; retry works.
- `revenue_events` records attributed purchases.

## 14. Rollout Plan
- Week 1: migrations + seeds + enqueue + renderer.
- Week 1.5: dispatch, outcomes, admin, QA, staging hardening.
- Deploy via DO; monitor `/api/health`.

## 15. Risks & Mitigations
- Deliverability: implement backoff and expose failures in Admin.
- Scope creep: require change orders for additional behaviour.
- Compliance drift: enforce validators, disclaimers, and audit trails.

## Build Checklist (for Agents)
See `docs/checkins/TODO.md` for the living task list used during implementation.
