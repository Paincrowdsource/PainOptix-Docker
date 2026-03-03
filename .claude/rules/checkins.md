---
paths:
  - "lib/checkins/**"
  - "app/api/checkins/**"
  - "app/c/**"
  - "docs/checkins/**"
---

# Check-Ins System Rules

## Safety (Non-Negotiable)
- PainOptix is educational-only. Never generate diagnoses, prescriptions, or treatment instructions.
- Phase 1 forbids LLM-generated copy. All messages are deterministic templates from vetted snippets.
- Red-flag handling is static keywords only. No LLM. Response is prewritten safety message + alert row.
- Include educational disclaimer on EVERY message and outcome page.
- Keep logs PII-free. Use structured JSON logging.

## Current Model
- 14-day daily SMS check-ins after assessment completion
- Message: pain score collection (0-10 scale)
- All users get check-ins (everyone gets Monograph free now)
- One-tap tokens: HMAC-signed, single-use, scoped to (assessment_id, day, branch)

## Feature Flags (default safe)
- `CHECKINS_ENABLED` — master switch
- `CHECKINS_DAILY` — daily frequency
- `CHECKINS_SANDBOX` — dry-run mode (1 = no actual sends)
- `CHECKINS_AUTOWIRE` — auto-enqueue on assessment completion

## Architecture
- Templates: shell + diagnosis insert + encouragement + CTA + disclaimer
- Scheduler: calls `POST /api/checkins/dispatch` (with `CHECKINS_DISPATCH_TOKEN`)
- Send window: `CHECKINS_SEND_TZ` (America/New_York) + `CHECKINS_SEND_WINDOW` (08:00-20:00)
- Outcomes: one-tap Better / Same / Worse via `/c/i` route

## Key Files
- `lib/checkins/enqueue.ts` — Queue creation
- `lib/checkins/dispatch.ts` — Message rendering and sending
- `app/api/checkins/dispatch/route.ts` — Dispatch endpoint
- `app/c/i/route.ts` — One-tap outcome landing
- `docs/checkins/SPEC.md` — Full technical spec

## API Endpoints
1. `POST /api/checkins/enqueue` — Creates queue rows on assessment completion
2. `POST /api/checkins/dispatch` — Cron: selects due rows, sends messages, updates status
3. `GET /c/i` — One-tap outcome (d=day, v=better|same|worse, token=signed)
4. `POST /api/checkins/ack` — Accepts optional note, runs red-flag matcher
5. `GET /api/admin/checkins` — Admin dashboard data
