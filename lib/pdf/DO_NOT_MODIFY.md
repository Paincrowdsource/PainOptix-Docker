# ⛔ STOP - READ BEFORE EDITING THIS DIRECTORY

## Critical Functions That Must Not Be Changed

### 1. transformLists() - DISABLED
- **Location**: puppeteer-generator.ts, lines ~320-376
- **Status**: INTENTIONALLY COMMENTED OUT
- **Reason**: Breaks Enhanced PDF formatting
- **If you think this should be enabled, you're wrong**

### 2. stripEndMarkers() - REQUIRED
- **Location**: puppeteer-generator.ts, line ~52
- **Status**: MUST BE CALLED for all content
- **Reason**: Removes content artifacts from monographs
- **If you remove this, END markers will appear**

### 3. PDF Settings - LOCKED
```javascript
{
  format: 'Letter',     // DO NOT CHANGE
  margin: {
    top: '1in',        // DO NOT CHANGE
    right: '1in',      // DO NOT CHANGE
    bottom: '1in',     // DO NOT CHANGE
    left: '1in'        // DO NOT CHANGE
  }
}
```

## Before Making Any Changes
1. Read `/PDF_GENERATION_RULES.md`
2. Run test suite: `npm run test:pdfs`
3. Get approval from team lead
4. Document your changes

## Contact for Questions
If you think something needs to change:
1. Document the problem with screenshots
2. Propose solution with test results
3. Get review before implementing

**Last Updated:** August 15, 2025
**Fixed by:** [Your Team]