# PainOptix

Diagnostic assessment tool for back pain. Users complete a 16-question assessment, receive a personalized Monograph guide, and get 14 days of daily SMS check-ins tracking their pain progression.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (Postgres + Auth + Row Level Security)
- **SMS**: Twilio
- **Email**: SendGrid
- **PDF Generation**: Puppeteer with system Chromium
- **Deployment**: Docker on DigitalOcean App Platform

## Quick Start

```bash
# Copy environment variables
cp .env.example .env.local

# Install dependencies
npm install

# Run locally
npm run dev        # http://localhost:3000
```

## Project Structure

```
app/              # Next.js App Router (pages, API routes, admin dashboard)
lib/              # Core business logic
  auth/           # Admin authentication (dual-layer: cookie + Supabase)
  checkins/       # 14-day daily SMS check-in system
  pdf/            # PDF generation (Puppeteer)
  email/          # Email templates and sequences
components/       # React components
content/          # Guide content (markdown files)
  guides/         # free/, enhanced/, monograph/
docs/             # Documentation
  architecture/   # System architecture (admin auth, PDF pipeline)
  checkins/       # Check-ins spec and operations
  operations/     # Testing, known issues, ops guides
  archive/        # Historical incident reports
supabase/         # Database migrations
scripts/          # Utility and maintenance scripts
.claude/rules/    # AI agent rules (path-scoped, auto-load)
```

## Deployment

This repository auto-deploys to production on push to `main`. There is no staging environment — test locally first.

See [CLAUDE.md](./CLAUDE.md) for deployment details and critical project rules.

## Documentation

| Topic | Location |
|-------|----------|
| AI agent instructions | [CLAUDE.md](./CLAUDE.md) |
| Admin authentication | [docs/architecture/admin-auth.md](./docs/architecture/admin-auth.md) |
| PDF generation pipeline | [docs/architecture/pdf-pipeline.md](./docs/architecture/pdf-pipeline.md) |
| Check-ins system spec | [docs/checkins/SPEC.md](./docs/checkins/SPEC.md) |
| Testing guide | [docs/operations/testing-guide.md](./docs/operations/testing-guide.md) |
| Known issues | [docs/operations/known-issues.md](./docs/operations/known-issues.md) |
