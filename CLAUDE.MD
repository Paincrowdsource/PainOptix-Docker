# CLAUDE.md - PainOptix Docker Deployment

**CRITICAL: This is the PRODUCTION repository that deploys to DigitalOcean**

## Repository Context
- **This Repo**: `docker-repo` → Pushes to `PainOptix-Docker` (GitHub) → Auto-deploys to DigitalOcean
- **Parent Repo**: `painoptix-app` - Development repository (NOT deployed)
- **Current Production**: https://painoptix-clean-9n639.ondigitalocean.app

## Why This Repo Exists
- DigitalOcean deployment requires specific Docker configuration
- Separates production code from development experiments
- Contains only tested, production-ready code

## Critical Differences from Parent
- This repo NOW HAS its own `package.json` (required for DigitalOcean build)
- Contains `enhanced-dom-glue-ship.ts` (added for bibliography fix)
- All supabaseAdmin() calls fixed for proper scope
- Contains production environment configurations
- Must keep package.json in sync with parent repo

## Deployment Process
1. Make changes here (docker-repo)
2. Test locally: `npm run dev` (uses parent's package.json)
3. Commit and push to main
4. DigitalOcean auto-rebuilds and deploys

## ⚠️ CRITICAL: BIBLIOGRAPHY FORMATTING - NEVER MODIFY WITHOUT READING

### The Great Bibliography War (January 2025)
**Time Lost: 12+ hours over multiple days**
**Problem: Enhanced PDF bibliographies were completely broken**

### DO NOT EVER:
1. ❌ Let both server AND client format the bibliography (they will fight)
2. ❌ Try to keep full DOI URLs unbroken in PDFs (Puppeteer WILL break at "/")
3. ❌ Add sentinel tokens without removing them at EVERY stage
4. ❌ Modify enhanced-dom-glue-ship.ts bibliography section without testing ALL guides

### ALWAYS DO:
1. ✅ Server formatting is authoritative (normalizeEnhancedBibliography)
2. ✅ Use [DOI] markers instead of full URLs
3. ✅ Check for `ol.bibliography` before client-side manipulation
4. ✅ Test with BOTH facet_arthropathy AND sciatica

### Key Files:
- `lib/pdf/puppeteer-generator.ts` - Server-side bibliography normalization (CRITICAL)
- `lib/pdf/enhanced-dom-glue-ship.ts` - Client-side DOM manipulation (BE CAREFUL!)
- `lib/pdf/master-template.ts` - CSS styles for bibliography

## Current Features (as of January 2025 - post bibliography fix)

### Enhanced V2 PDF System
- **Feature Flag**: `ENHANCED_V2=1` (env) or `x-po-enhanced-v2: 1` (header)
- **Status**: Implemented, tested, ready for production
- **Affects**: Only Enhanced ($5) tier PDFs
- **Safety**: Monograph ($20) tier completely isolated

### PDF Generation Pipeline
- All tiers use Puppeteer (no React-PDF)
- Single template with tier conditionals
- Synchronous generation (no job queue)

## Quick Commands

### Test Production PDFs
```bash
# Monograph (should be ~5MB)
curl -X POST https://painoptix-clean-9n639.ondigitalocean.app/api/download-guide \
  -H "Content-Type: application/json" \
  -d '{"assessmentId":"admin-test-sciatica","tier":"monograph"}' \
  -o prod-mono.pdf

# Enhanced with V2 (should be ~230KB with better formatting)
curl -X POST https://painoptix-clean-9n639.ondigitalocean.app/api/download-guide \
  -H "Content-Type: application/json" \
  -H "x-po-enhanced-v2: 1" \
  -d '{"assessmentId":"admin-test-facet_arthropathy","tier":"enhanced"}' \
  -o prod-enhanced-v2.pdf
Emergency Rollback
bash# Option 1: Via DigitalOcean Dashboard
# Activity → Select previous deployment → Rollback

# Option 2: Via Git
git revert HEAD
git push origin main
Common Build Fixes
supabaseAdmin Scope Issues
Each route function needs its own declaration:
typescriptexport async function POST() {
  const supabase = supabaseAdmin(); // At function level
  // ...
}
Missing Module Errors
If build fails on missing imports, check if file exists in docker-repo (not just parent)
Environment Variables (DigitalOcean)
See parent repo CLAUDE.md for full list. Key addition:

ENHANCED_V2=1 - Enables V2 formatting for Enhanced PDFs globally

Never Do in This Repo

Experimental features without feature flags
Direct database schema changes
Untested PDF pipeline modifications
Changes that affect Monograph tier without explicit safeguards

Testing Checklist Before Push

 Local build succeeds: npm run build
 TypeScript clean: npx tsc --noEmit
 Monograph PDFs unchanged
 Enhanced baseline works
 Enhanced V2 improvements visible (with flag)

Contact for Issues

Build failures: Check DigitalOcean logs first
PDF issues: Test with curl commands above
Rollback needed: Use DO dashboard for fastest recovery


Last Updated: August 2025
Deployed Commit: 51c631e
Parent Repo: ../painoptix-app
