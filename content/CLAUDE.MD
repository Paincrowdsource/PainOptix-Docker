# PainOptix Project Content Context (`CLAUDE.MD`)

## 1. PROJECT OVERVIEW
- **Purpose**: Medical education platform generating personalized lower back pain assessment reports
- **Three pricing tiers**: 
  - FREE ($0) - Basic HTML report
  - ENHANCED ($5) - Clinical guide PDF (~180-230KB)
  - MONOGRAPH ($20) - Comprehensive medical document PDF (~5-8MB)
- **Tech Stack**: Next.js 14, Supabase, Stripe, TypeScript, Puppeteer
- **Production**: https://painoptix-clean-9n639.ondigitalocean.app
- **Repository**: docker-repo → PainOptix-Docker (GitHub) → DigitalOcean

## 2. CRITICAL: DEPLOYMENT ARCHITECTURE
- **Working Directory**: `docker-repo` (NOT painoptix-app)
- **GitHub**: Paincrowdsource/PainOptix-Docker (NOT PainOptix)
- **Deployment**: DigitalOcean App Platform (Docker-based, auto-deploys on push to main)
- **Build Command**: Runs from docker-repo with shared package.json from parent
- **Health Check**: `/api/health` endpoint required by DigitalOcean

## 3. PDF GENERATION - CURRENT STATE (as of commit 51c631e)

### Architecture Reality:
- **Single Pipeline**: ALL tiers use Puppeteer via `lib/pdf/puppeteer-generator.ts`
- **NO React-PDF**: Despite docs, we don't use React-PDF anywhere
- **NO Worker Queues**: Synchronous generation only
- **Template**: `lib/pdf/master-template.ts` handles all tiers with conditional logic

### Content Sources:
- **Free**: `/content/guides/free/*.md`
- **Enhanced**: `/content/guides/enhanced/*.md`  
- **Monograph**: `/content/monographs/*.md`

### Enhanced V2 Feature Flag System:
```javascript
// Activated by either:
process.env.ENHANCED_V2 === '1'  // Global env var
req.headers.get('x-po-enhanced-v2') === '1'  // Per-request header

// All V2 improvements are guarded:
if (tier === 'enhanced' && options.enhancedV2Enabled) {
  // V2 formatting runs here
}
V2 Improvements (when enabled):

Hanging bullets with .enh-bullet class
Citation gluing (keeps [Author et al., YEAR] together)
Phrase protection (prevents orphaned words)
Bibliography normalization
Triple-pass <br> artifact removal

4. COMMON BUILD/DEPLOYMENT ISSUES
TypeScript Scope Issues:
typescript// WRONG - causes build failure
export async function POST() {
  try {
    const supabase = supabaseAdmin(); // Inside try block
  }
  await supabase... // ERROR: not in scope
}

// CORRECT
export async function POST() {
  const supabase = supabaseAdmin(); // At function scope
  try {
    await supabase...
  }
}
Missing Imports:

Don't import enhanced-dom-glue-ship - file doesn't exist in docker-repo
Use inline DOM manipulation instead

Windows Development Issues:

Add nul to .gitignore (Windows phantom file)
Use git bash or WSL for commands
Port 3000 conflicts: taskkill /F /IM node.exe

5. TESTING COMMANDS
Local Development:
bashcd docker-repo
npm run dev

# Test Enhanced baseline
curl -X POST http://localhost:3000/api/download-guide \
  -H "Content-Type: application/json" \
  -d '{"assessmentId":"admin-test-facet_arthropathy","tier":"enhanced"}' \
  -o test.pdf

# Test Enhanced V2
curl -X POST http://localhost:3000/api/download-guide \
  -H "Content-Type: application/json" \
  -H "x-po-enhanced-v2: 1" \
  -d '{"assessmentId":"admin-test-facet_arthropathy","tier":"enhanced"}' \
  -o test-v2.pdf
Production Testing:
Replace localhost:3000 with https://painoptix-clean-9n639.ondigitalocean.app
6. CONTENT STRUCTURE
Enhanced Markdown Requirements:
yaml---
title: Facet Arthropathy
subtitle: Enhanced Clinical Guide
tier: enhanced
---

## Understanding Your Condition
[content...]

## Bibliography
[citations...]
Monograph Placeholders (should auto-replace):

{pain_location} → User's answer
{duration} → User's answer
{initial_pain_score} → User's score
{name} → Patient name
{current_date} → Today's date

7. CRITICAL PATHS & FILES
Never Touch Without Extreme Caution:

lib/pdf/puppeteer-generator.ts - Core PDF generator
lib/pdf/master-template.ts - Shared template
app/api/download-guide/route.ts - Main API endpoint

Safe to Modify:

scripts/ - Test and utility scripts
docs/ - Documentation
Content under feature flags

8. ENVIRONMENT VARIABLES
Required in DigitalOcean:
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=SG...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
ENHANCED_V2=1  # Optional: enables V2 globally
9. ROLLBACK PROCEDURES
If PDFs Break in Production:

Immediate: DigitalOcean → Activity → Rollback to previous deployment
Code Fix:
bashgit revert HEAD
git push origin main

Feature Flag: Unset ENHANCED_V2 env var

10. KNOWN ISSUES & TODOS
Enhanced PDFs (even with V2):

Some phrases still orphan
Bibliography spacing needs refinement
Occasional citation splits remain

Monographs:

Image sizing inconsistent
Page breaks sometimes split sections
Large file size (~5-8MB)

Technical Debt:

No job queue for async PDF generation
No React-PDF separation as originally planned
Puppeteer version warnings (works but outdated)

11. CLIENT CONTEXT

Client: Dr. Bradley W. Carpentier, MD
Entity: Dr. C. Pain MD Holdings, LLC
Requirements: Professional medical document standards
Branding: Must maintain doctor attribution
Critical: SMS/Email follow-up system for patient engagement

12. DEBUGGING TIPS
PDF Issues:

No styling: Check tier logic in puppeteer-generator
Text overflow: Adjust CONTENT_WIDTH in template
Missing content: Check markdown file exists and loads
V2 not working: Verify flag is set and tier === 'enhanced'

Build Failures:

supabaseAdmin errors: Check function scope
Module not found: Verify file exists in docker-repo
TypeScript errors: Run npx tsc --noEmit locally

13. NEVER DO THIS

Create alternative PDF renderers
Touch Monograph pipeline when fixing Enhanced
Remove doctor attribution
Deploy from painoptix-app (use docker-repo only)
Set ENHANCED_V2=1 in production without testing
Use localStorage in artifacts
Assume placeholder replacement works (always verify)

14. QUICK WINS AVAILABLE

Enable Enhanced V2 globally (tested, ready)
Add more glue rules for phrase protection
Implement image optimization for Monographs
Add PDF caching to reduce generation time


Last Updated: August 2025
Current Working Commit: 51c631e