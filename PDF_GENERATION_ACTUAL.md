# ⚠️ CRITICAL WARNINGS - ISSUES WE'VE FIXED

## DO NOT REINTRODUCE THESE BUGS

### Enhanced PDF Issues (FIXED 8/15/2025)
- **Problem:** Bullets and bibliography numbers appearing on separate lines
- **Root Cause:** transformLists() function was converting semantic HTML to paragraphs
- **Solution:** DISABLED transformLists() - maintain semantic HTML structure
- **Test:** Generate Enhanced Sciatica - bullets must stay with content

### Monograph PDF Issues (FIXED 8/15/2025)
- **Problem 1:** "END" markers appearing in bibliography
- **Root Cause:** Content sentinels not stripped from markdown
- **Solution:** Added stripEndMarkers() function
- **Test:** Generate SI Joint monograph - no "END" should appear

- **Problem 2:** Grammar inconsistency in headers
- **Root Cause:** "Understanding of X" instead of "Understanding X"
- **Solution:** Fixed in all monograph markdown files
- **Test:** All headers should read "Understanding [Condition]"

### Universal PDF Issues (FIXED 8/15/2025)
- **Problem:** Text cutoff on right edge
- **Root Cause:** Incorrect margins, scaling, and double padding
- **Solution:** Letter format, 1" margins, no scale
- **Test:** No text should be cut off in any PDF

## Critical Code Sections

```typescript
// Line ~376 & ~1056 in puppeteer-generator.ts
// THIS MUST STAY COMMENTED:
// contentAsHtml = transformLists(contentAsHtml); // DISABLED INTENTIONALLY

// Line ~52 in puppeteer-generator.ts
// THIS FUNCTION IS REQUIRED:
function stripEndMarkers(md: string): string {
  // Critical for monograph PDFs
}
```

# PDF Generation Implementation Details

## Current Architecture

### PDF Generation Pipeline
1. **Request**: API endpoint `/api/download-guide` receives request
2. **Content Loading**: Fetches appropriate markdown based on tier
3. **Processing**: 
   - Enhanced: Markdown → HTML → PDF
   - Monograph: Markdown → stripEndMarkers() → HTML → PDF
4. **Generation**: Puppeteer renders HTML with tier-specific styles
5. **Response**: Returns PDF buffer

### Tier System
- **Free ($0)**: Enhanced PDF with basic content
- **Paid ($5)**: Enhanced PDF with full content
- **Monograph ($20)**: Full medical monograph with bibliography

### Key Files
- `/lib/pdf/puppeteer-generator.ts` - Main PDF generation logic
- `/lib/pdf/styles.ts` - PDF styling configurations
- `/app/api/download-guide/route.ts` - API endpoint
- `/content/enhanced/*.md` - Enhanced tier content
- `/content/monographs/*.md` - Monograph tier content

## Feature Flags

### Enhanced V2 System
- **Flag**: `ENHANCED_V2=1` (env) or `x-po-enhanced-v2: 1` (header)
- **Affects**: Only Enhanced tier PDFs
- **Changes**: Improved formatting, better spacing, cleaner layout
- **Safety**: Completely isolated from Monograph tier

## Testing

### Local Testing
```bash
# Test Enhanced PDF
npm run test:enhanced

# Test Monograph PDF
npm run test:monograph

# Test all tiers
npm run test:pdfs
```

### Production Testing
```bash
# See README.md for curl commands
```

## Troubleshooting

### Common Issues
1. **Bullets on wrong line**: transformLists() was accidentally enabled
2. **END text appearing**: stripEndMarkers() not being called
3. **Text cutoff**: Wrong margins or scale parameter added
4. **Long generation time**: Check for infinite loops in content processing

### Debug Mode
```javascript
// Add to puppeteer-generator.ts for debugging
const DEBUG = process.env.DEBUG_PDF === '1';
if (DEBUG) {
  console.log('PDF HTML:', html);
  // Save debug HTML
  fs.writeFileSync('debug-pdf.html', html);
}
```