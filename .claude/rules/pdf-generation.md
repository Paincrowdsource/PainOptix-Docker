---
paths:
  - "lib/pdf/**"
  - "app/api/download-guide/**"
  - "content/guides/**"
---

# PDF Generation Rules

## Current State
Only Monograph tier is actively served (payments hibernated, everyone gets Monograph free).
Enhanced tier code exists but is inactive — `ENHANCED_V2=1` flag only triggers for `tier === 'enhanced'`.

## NEVER DO
- Re-enable `transformLists()` — permanently disabled (Aug 2025, broke bullet/bibliography formatting)
- Change from Letter format or 1" margins
- Add `scale`, `preferCSSPageSize`, or any extra Puppeteer parameters
- Remove `stripEndMarkers()` from monograph pipeline — END text will appear in PDFs
- Let both server AND client format bibliography (server wins, client defers)
- Keep full DOI URLs unbroken in PDFs (Puppeteer breaks at "/")
- Add sentinel tokens without removing them at EVERY stage

## Puppeteer Config (do not modify)
```javascript
{ format: 'Letter', margin: { top: '1in', right: '1in', bottom: '1in', left: '1in' }, printBackground: true }
```

## Bibliography Pipeline (Enhanced tier — currently inactive but preserved)
```
Markdown → HTML (marked.parse, breaks: false)
  → Server: normalizeEnhancedBibliography() splits at year pattern (?<=\(\d{4}[a-z]?\)\.)
  → Server: finalDeSentinelize() removes remaining tokens
  → Client: DOM glue protects page ranges IF ol.bibliography exists
  → Puppeteer generates PDF
```
Server formatting is authoritative. Use [DOI] markers instead of full URLs.

## Monograph Pipeline
- `stripEndMarkers()` removes END, [END], >>END sentinels and converts >>BIBLIOGRAPHY to ## Bibliography
- Must be called on ALL monograph content before HTML conversion
- Placeholder replacement: [Name Placeholder] and [Date Placeholder] handled in API route

## Key Files
- `lib/pdf/puppeteer-generator.ts` — Main generation + bibliography normalization
- `lib/pdf/enhanced-dom-glue-ship.ts` — Client DOM manipulation (Enhanced tier only)
- `lib/pdf/master-template.ts` — CSS styles
- `app/api/download-guide/route.ts` — API endpoint

## Testing
```bash
npm run test:pdfs
# Or manually:
curl -X POST "http://localhost:3000/api/download-guide?assessmentId=admin-test-facet_arthropathy&tier=monograph" -o test.pdf
```

## Signs Something Is Wrong
- Monograph: "END" text visible, >>BIBLIOGRAPHY not converted, placeholders showing
- Enhanced (if reactivated): PDF < 200KB, multiple authors in one numbered item, [[DOI|...]] or [[RANGE|...]] visible
- All tiers: text cutoff on right edge, weird word spacing
