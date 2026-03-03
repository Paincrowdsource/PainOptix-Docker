---
paths:
  - "Dockerfile*"
  - ".github/**"
  - "next.config.js"
  - ".do/**"
---

# Deployment Rules

## This Repo IS Production
Pushes to `main` auto-deploy to DigitalOcean app `painoptix-clean`. No staging environment. Test locally first.
- GitHub: `Paincrowdsource/PainOptix-Docker`
- DigitalOcean App Platform with Docker buildpack

## Docker Build
- Multi-stage: deps → builder → runner (with system Chromium for Puppeteer)
- Build args promoted to ENV for Next.js static generation
- System Chromium at `/usr/bin/chromium` (`PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`)
- Port 8080 for DigitalOcean
- `standalone` output mode in `next.config.js`

## Known Gotcha: Job Components
DigitalOcean job components with `git:` source rebuild the entire Next.js app.
If the job lacks env vars, the build fails and blocks ALL deployments (caused 20+ failed deploys in Oct 2025).
GitHub Actions handles check-in dispatch — the DO job is redundant.
See `docs/archive/deployment-crisis-2025-10.md` for the full incident report.

## Environment Flags (production)
```
DISABLE_PAYMENTS=true                    # Bypasses Stripe, everyone gets Monograph
NEXT_PUBLIC_VALUE_FIRST_FUNNEL=true      # SMS-first funnel
NEXT_PUBLIC_DISABLE_PAYMENTS=true        # Hides upgrade UI
CHECKINS_ENABLED=true                    # 14-day daily SMS
ENHANCED_V2=1                            # Legacy: only affects Enhanced tier (not served)
```
