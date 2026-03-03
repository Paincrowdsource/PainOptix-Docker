# PainOptix Content Guide

## Overview
PainOptix generates personalized pain assessment guides as PDFs. All users receive the Monograph (comprehensive) tier for free.

## Architecture
- **PDF Renderer**: `lib/pdf/puppeteer-generator.ts` (Puppeteer-based, NOT jspdf or final-renderer)
- **Database**: Supabase with Row Level Security
- **Payments**: Hibernated (`DISABLE_PAYMENTS=true`) — Stripe code exists but is bypassed
- **Email**: SendGrid
- **SMS**: Twilio
- **Deployment**: Docker on DigitalOcean App Platform

## Content Tiers (Legacy — Everyone Gets Monograph Now)
- **Monograph** (active): Comprehensive medical document with bibliography, images, 30+ pages
- **Enhanced** (hibernated): Clinical guide with exercises, 15+ pages — code exists but not served
- **Standard/Free** (hibernated): Basic info guide, 5+ pages — code exists but not served

## Content Structure

### Monograph Markdown
- Full markdown with bibliography section
- May contain `[Name Placeholder]` and `[Date Placeholder]` — replaced at render time in API route
- Content sentinels (`END`, `[END]`, `>>END`) removed by `stripEndMarkers()` before HTML conversion
- `>>BIBLIOGRAPHY` converted to `## Bibliography` by `stripEndMarkers()`

### Enhanced Markdown (Legacy)
```yaml
---
title: Condition Name
subtitle: Enhanced Clinical Guide
---

>>EXECUTIVE_SUMMARY
Summary text here
>>END

>>KEY_POINTS
- Point 1
- Point 2
>>END

## Regular markdown content...
```

## Key Files
- `lib/pdf/puppeteer-generator.ts` — Main PDF renderer (generatePdfV2, generatePdfFromContent)
- `app/api/download-guide/route.ts` — PDF download endpoint
- `content/guides/monograph/*.md` — Monograph content files (actively served)
- `content/guides/enhanced/*.md` — Enhanced content files (legacy)
- `content/guides/free/*.md` — Standard content files (legacy)

## Client Requirements
- Dr. Bradley W. Carpentier, MD — Board-certified pain management specialist
- Business entity: Dr. C. Pain MD Holdings, LLC
- Maintain professional medical document standards
- Never remove Dr. Carpentier attribution

## Testing
```bash
npm run test:pdfs

# Manual test
curl -X POST "http://localhost:3000/api/download-guide?assessmentId=admin-test-facet_arthropathy&tier=monograph" -o test.pdf
```

Always verify PDFs in an actual PDF reader, not browser preview. Use test card `4242424242424242` if Stripe is ever reactivated.
