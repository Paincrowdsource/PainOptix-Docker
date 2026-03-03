# Known PDF Issues (as of August 12, 2025)

## Enhanced ($5) - Even with V2
- Some phrases still orphan (need more glue rules)
- Bibliography spacing inconsistent
- Occasional citations still split across lines
- Content linter found 1 split citation in facet_arthropathy.md

## Monograph ($20)
- **CRITICAL BUG**: Template placeholders showing literally instead of being replaced:
  - `{pain_location}` should show user's actual pain location
  - `{duration}` should show user's actual duration
  - `{initial_pain_score}` should show user's actual pain score
  - Other dynamic placeholders may also be affected
- Images sometimes render too large
- Page breaks can split sections awkwardly
- Some image paths may not resolve correctly in production

## Why They Look Different
- **Enhanced**: Simple markdown → basic template → ~180-230KB
  - Minimal formatting, no images
  - Text-only content
  - Optimized for quick reading
  
- **Monograph**: Complex markdown with images → rich template → 5-8MB
  - Full formatting with cover page
  - Embedded medical illustrations
  - Professional layout with page breaks
  
Both use same Puppeteer pipeline but different content sources and CSS templates.

## Technical Details

### Enhanced V2 Feature Flag
- **Status**: Implemented and tested
- **Activation**: Via `ENHANCED_V2=1` env or `x-po-enhanced-v2: 1` header
- **Default**: OFF (no env variable set)
- **Impact**: Only affects Enhanced tier when explicitly enabled

### Placeholder Bug Details
The placeholder replacement should happen in:
1. `lib/pdf/puppeteer-generator.ts` - for development
2. `lib/pdf-helpers.ts` - `replacePlaceholders()` function
3. Content may have hardcoded placeholders that aren't being caught

**Expected behavior**:
- `[Name Placeholder]` → Patient name
- `[Date Placeholder]` → Current date
- Dynamic response placeholders → User's actual responses

**Actual behavior**:
- Placeholders appear literally in the PDF
- Suggests replacement logic is not executing or not matching patterns

## Priority Fixes Needed
1. **HIGH**: Fix Monograph placeholder replacement bug
2. **MEDIUM**: Improve Enhanced V2 citation gluing
3. **LOW**: Optimize image sizing in Monographs
4. **LOW**: Refine page break logic

## Testing Commands

### Check for unreplaced placeholders:
```bash
# Generate test Monograph
curl -X POST http://localhost:3000/api/download-guide \
  -H "Content-Type: application/json" \
  -d '{"assessmentId":"admin-test-sciatica","tier":"monograph"}' \
  -o test-mono.pdf

# Convert to text and search for placeholders (requires pdftotext)
pdftotext test-mono.pdf - | grep -E "\{.*\}|\[.*Placeholder\]"
```

### Test Enhanced V2:
```bash
# With header flag
curl -X POST http://localhost:3000/api/download-guide \
  -H "Content-Type: application/json" \
  -H "x-po-enhanced-v2: 1" \
  -d '{"assessmentId":"admin-test-facet_arthropathy","tier":"enhanced"}' \
  -o test-enhanced-v2.pdf
```

## Notes
- V2 changes are fully guarded and safe for production
- Monograph issues existed before V2 implementation
- Enhanced baseline behavior is preserved
- All issues are cosmetic/formatting - no data loss or security concerns