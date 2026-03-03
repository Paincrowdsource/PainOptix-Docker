# CLAUDE.md - PainOptix

## What This Is
Diagnostic assessment tool for back pain. Free for all users — everyone gets the full Monograph guide. SMS-first contact capture with 14-day daily check-ins for pain score tracking.

- **Framework**: Next.js 14, TypeScript, Tailwind
- **Database**: Supabase (Postgres + RLS)
- **SMS/Email**: Twilio + SendGrid
- **PDF**: Puppeteer with system Chromium
- **Deployment**: Docker on DigitalOcean App Platform

## Current Business Model
- Payments hibernated (`DISABLE_PAYMENTS=true`) — Stripe code exists but is bypassed
- All users receive the Monograph (comprehensive guide) for free
- SMS collection is the primary goal — phone required, email optional
- Value-first funnel: assessment -> symptom echo (curiosity gap) -> SMS capture -> guide delivery
- 14-day daily SMS check-ins tracking pain scores (0-10)
- Guest assessments supported (can complete without contact info, claim later)

## Deployment — This Repo IS Production
Pushes to `main` auto-deploy to DigitalOcean app `painoptix-clean`. No staging environment.
- GitHub: `Paincrowdsource/PainOptix-Docker`
- Test locally, then commit and push

## Supabase — Read This Every Session
Production DB is **"Paincrowdsource Staging"** (project ID: `wljwlgjeqoulxvwbfgpy`).
This IS production despite the misleading name. The other project "PainCrowdSource.Org" (`usefhnghfstaloqxitlx`) is a DIFFERENT application.

## PDF Generation
Only Monograph tier is actively generated. Bibliography/formatting rules are in `.claude/rules/pdf-generation.md` (auto-loads when touching `lib/pdf/**`). Key rule: server formatting is authoritative, client defers.

Key files: `lib/pdf/puppeteer-generator.ts`, `lib/pdf/enhanced-dom-glue-ship.ts`, `lib/pdf/master-template.ts`

## Key Commands
```bash
npm run dev            # Local development
npm run build          # Production build
npm run test:pdfs      # PDF generation tests
```

## Environment Flags (production)
```
DISABLE_PAYMENTS=true              # Bypasses Stripe, everyone gets Monograph
NEXT_PUBLIC_VALUE_FIRST_FUNNEL=true  # SMS-first funnel
NEXT_PUBLIC_DISABLE_PAYMENTS=true    # Hides upgrade UI
CHECKINS_ENABLED=true              # 14-day daily SMS check-ins
ENHANCED_V2=1                      # Legacy: only affects Enhanced tier (not served)
DEBUG_PDF=1                        # Saves debug HTML for PDF troubleshooting
```

## Documentation
- `.claude/rules/` — Path-scoped rules (auto-load when touching relevant code)
- `docs/architecture/` — Admin auth, PDF pipeline
- `docs/checkins/` — Check-ins spec, content format, rollout
- `docs/operations/` — Testing guide, known issues
- `docs/archive/` — Historical incident reports (preserved for reference)

## Legacy Code Note
The codebase contains Stripe checkout, 3-tier payment logic (Standard/Enhanced/Monograph), and upgrade flows. This code is hibernated via feature flags, not deleted. If you encounter payment/tier code, it's intentionally disabled — don't remove it or try to fix it.
