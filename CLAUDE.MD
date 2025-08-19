# CLAUDE.md - PainOptix V1.2

This is the PainOptix V1.2 project, completely separate from PainCrowdsource.

## Project Overview
PainOptix V1.2 is a diagnostic assessment tool for back pain with these key features:
- Email/SMS required before showing results
- Results sent via message only (never shown on screen)
- Universal data capture (all users, not just paid)
- 14-day follow-up automation
- Auto-enrollment to PainCrowdsource for paid users

## Key V1.2 Requirements from Bradley
1. Collect email/SMS upfront (before diagnosis)
2. Send results via email/SMS only
3. Track ALL assessments (free and paid)
4. 14-day follow-up (not 72-hour)
5. Delete My Data feature
6. Referrer source tracking
7. Initial pain score collection
8. Telehealth booking tracking (future)

## Archive Reference
Original V1.0 code is preserved in:
- Repository: https://github.com/Paincrowdsource/PainCrowdsourceWebsite
- Branch: painoptix-v1-archive
- Contains: All original code, documentation, TODOs

To access archived files:
```bash
git remote add archive https://github.com/Paincrowdsource/PainCrowdsourceWebsite.git
git fetch archive painoptix-v1-archive
git checkout archive/painoptix-v1-archive -- "path/to/file"
Development Status

[] Repository created
[] Next.js 14 initialized
[] Dependencies installed
[] Supabase schema created
[]Email/SMS gateway configured
[]Diagnostic engine ported
[]V1.2 flow implemented
## DEPLOYMENT NOTICE
**⚠️ IMPORTANT: This repository is NOT directly deployed to production**

- **Production deployment**: Use `docker-repo` subdirectory
- **GitHub**: `docker-repo` pushes to `Paincrowdsource/PainOptix-Docker`
- **Why**: DigitalOcean requires specific Docker configuration

### To Deploy Changes:
1. Test in this repo first
2. Copy changes to `docker-repo`
3. Commit and push from `docker-repo`
4. DigitalOcean auto-deploys from PainOptix-Docker repo

### Current Production Features:
- Enhanced V2 PDF formatting (feature-flagged)
- All three tiers working
- See `docker-repo/CLAUDE.md` for deployment details

## ⚠️ BIBLIOGRAPHY FORMATTING - NEVER TOUCH WITHOUT READING THIS

### The Great Bibliography War (January 2025)
**Time Lost: 12+ hours over multiple days**
**Problem: Enhanced PDF bibliographies were completely broken**

### DO NOT EVER:
1. ❌ Let both server AND client format the bibliography (they will fight)
2. ❌ Try to keep full DOI URLs unbroken in PDFs (Puppeteer WILL break at "/")
3. ❌ Add sentinel tokens without removing them at EVERY stage
4. ❌ Trust that markdown `breaks: false` will solve formatting issues
5. ❌ Modify enhanced-dom-glue-ship.ts bibliography section without testing ALL guides

### ALWAYS DO:
1. ✅ Server formatting is authoritative (normalizeEnhancedBibliography)
2. ✅ Use [DOI] markers instead of full URLs
3. ✅ Split entries at year pattern boundaries: `(?<=\(\d{4}[a-z]?\)\.)`
4. ✅ Check for `ol.bibliography` before client-side manipulation
5. ✅ Test with BOTH facet_arthropathy AND sciatica (different complexity)

### Current Architecture:
```
Markdown → HTML (marked.parse with breaks: false)
     ↓
Server: normalizeEnhancedBibliography() splits and formats
     ↓
Server: finalDeSentinelize() removes any remaining tokens
     ↓
Client: DOM glue ONLY protects page ranges if ol.bibliography exists
     ↓
Puppeteer generates PDF
```

### Key Files:
- `lib/pdf/puppeteer-generator.ts` - Server-side bibliography normalization
- `lib/pdf/enhanced-dom-glue-ship.ts` - Client-side DOM manipulation (BE CAREFUL!)
- `lib/pdf/master-template.ts` - CSS styles for bibliography

### Testing Commands:
```bash
# Generate Enhanced PDF
curl -X POST "http://localhost:3000/api/download-guide?assessmentId=admin-test-facet_arthropathy&tier=enhanced" -o test.pdf

# Check entry count (should be 10 for facet, 9 for sciatica)
grep -c '<li>' debug/enhanced-facet_arthropathy-final.html

# Verify no sentinels
grep -c "\\[\\[DOI" debug/enhanced-facet_arthropathy-final.html  # Should be 0
```

### Signs Something Is Wrong:
- PDF size < 200KB (should be 230-250KB for Enhanced)
- Multiple authors in single numbered item
- [[DOI|...]] or [[RANGE|...]] visible in PDF
- "DOI:" appears alone at end of line
- Page ranges split across lines

### Emergency Contacts:
- If bibliographies break again, check git blame on these files
- Original fix: January 2025 (check commit history)
- Key insight: Server must win, client must defer

## Other Critical Systems

### PDF Generation Tiers
- **Monograph**: $20 tier, includes images (5-9MB files)
- **Enhanced**: $5 tier, text only with bibliography (230-250KB)
- **Standard**: Free tier, basic formatting

### Environment Variables
- `ENHANCED_V2=1` - Enables Enhanced v2 formatting
- `BIB_DOI_MODE=label` - Uses [DOI] markers (other options: link, omit)
- `DEBUG_PDF=1` - Saves debug HTML files

**Last Updated: January 2025 - After the Bibliography War**