# PDF Generation Pipeline

**Last Updated**: March 2026

## Current State

Only Monograph tier is actively served — payments are hibernated (`DISABLE_PAYMENTS=true`) and all users receive the comprehensive Monograph guide for free. The Enhanced and Standard tier code still exists but is inactive.

## Pipeline Overview

```
Request → /api/download-guide
  → Load markdown content from content/guides/{tier}/
  → Monograph: stripEndMarkers() removes sentinels, converts >>BIBLIOGRAPHY
  → Enhanced (inactive): normalizeEnhancedBibliography() + DOM glue
  → marked.parse() converts markdown to HTML (breaks: false)
  → master-template.ts wraps HTML with CSS styles
  → Puppeteer renders HTML to PDF (Letter, 1" margins)
  → Return PDF buffer
```

## Key Files

| File | Role |
|------|------|
| `app/api/download-guide/route.ts` | API endpoint, tier routing |
| `lib/pdf/puppeteer-generator.ts` | Main generation logic (46KB) |
| `lib/pdf/master-template.ts` | CSS styles and HTML wrapper |
| `lib/pdf/enhanced-dom-glue-ship.ts` | Client-side DOM manipulation (Enhanced only) |
| `lib/pdf/image-processor.ts` | Image handling for Monograph |
| `content/guides/monograph/*.md` | Monograph content files |
| `content/guides/enhanced/*.md` | Enhanced content files (inactive) |
| `content/guides/free/*.md` | Standard content files (inactive) |

## Puppeteer Config (do not change)

```javascript
{ format: 'Letter', margin: { top: '1in', right: '1in', bottom: '1in', left: '1in' }, printBackground: true }
```

No `scale`, `preferCSSPageSize`, or other parameters. Letter format, not A4.

## Monograph-Specific Processing

`stripEndMarkers()` is required for all monograph content:
- Removes: `END`, `[END]`, `>>END` sentinels
- Converts: `>>BIBLIOGRAPHY` → `## Bibliography`
- Placeholder replacement: `[Name Placeholder]` and `[Date Placeholder]` handled in the API route

## Enhanced Tier (Legacy — Currently Inactive)

The Enhanced V2 system was the result of weeks of formatting work. It's controlled by `ENHANCED_V2=1` env flag and only activates when `tier === 'enhanced'`. Since no users receive Enhanced tier, this code path doesn't execute in production.

**Bibliography pipeline** (if reactivated):
1. Server: `normalizeEnhancedBibliography()` splits entries at year pattern `(?<=\(\d{4}[a-z]?\)\.)`
2. Server: `finalDeSentinelize()` removes remaining sentinel tokens
3. Client: DOM glue protects page ranges if `ol.bibliography` exists
4. Rule: Server formatting is authoritative, client only assists

**`transformLists()`**: Permanently disabled (Aug 2025). Converted semantic HTML to paragraphs, broke bullet/bibliography formatting.

## Environment Variables

| Variable | Purpose | Status |
|----------|---------|--------|
| `ENHANCED_V2=1` | Enhanced tier formatting | Legacy (tier not served) |
| `BIB_DOI_MODE=label` | Bibliography DOI markers | Legacy (Enhanced tier) |
| `DEBUG_PDF=1` | Save debug HTML files | Active for troubleshooting |

## Testing

```bash
npm run test:pdfs

# Manual monograph test
curl -X POST "http://localhost:3000/api/download-guide?assessmentId=admin-test-facet_arthropathy&tier=monograph" -o test.pdf

# Manual enhanced test (legacy)
curl -X POST "http://localhost:3000/api/download-guide?assessmentId=admin-test-facet_arthropathy&tier=enhanced" -o test.pdf
```

## Bug History

See `.claude/rules/pdf-generation.md` for the full list of never-do rules.

Key incidents:
- **Jan 2025**: Bibliography war (12+ hrs) — server/client formatting conflict
- **Aug 2025**: `transformLists()` broke bullets/bibliography, `stripEndMarkers()` needed for monographs, margins/scaling standardized
