# PDF Testing Guide

## Required Test Suite for PDF Changes

### Before ANY PDF Code Changes
Run this test sequence to ensure no regression:

```bash
# 1. Generate test PDFs
npm run test:generate-pdfs

# 2. Check for known issues
npm run test:check-pdfs
```

## Manual Test Checklist

### Enhanced PDFs (Free/Paid Tiers)

#### Test Case 1: Sciatica Enhanced
- ✅ Navigate to Admin > Generate Enhanced Sciatica
- ✅ Check "Common features include:" has bullets WITH content
- ✅ Check "How Doctors Evaluate Sciatica" bullets are formatted correctly
- ✅ Verify bibliography: "1. Brosseau..." on SAME line (not "1." alone)
- ✅ No text cutoff on right edge

#### Test Case 2: Facet Arthropathy Enhanced
- ✅ All bullet points have content on same line
- ✅ Bibliography numbers stay with text
- ✅ No "malig nancy" or "Carpen tier" splits

### Monograph PDFs ($20 Tier)

#### Test Case 1: SI Joint Dysfunction
- ✅ NO "END" text anywhere in PDF
- ✅ Bibliography shows "Bibliography" heading (not ">>BIBLIOGRAPHY")
- ✅ Header says "Understanding Sacroiliac Joint Discomfort" (no "of")

#### Test Case 2: All Monographs
- ✅ Headers: "Understanding X" not "Understanding of X"
- ✅ No content artifacts (END, >>END, [END])
- ✅ Clean bibliography formatting

## Red Flags - Stop if You See These

🚨 **CRITICAL ISSUES:**
- Bullet point on its own line (content below)
- Bibliography number alone (e.g., "1." with text on next line)
- "END" appearing anywhere in PDF
- ">>BIBLIOGRAPHY" instead of "Bibliography"
- Text cut off on right edge
- Weird spacing between words in bullets

## Automated Test Creation

```javascript
// Add to test-pdfs.js
const criticalTests = {
  enhanced: {
    noOrphanedBullets: (html) => !html.includes('<p class="enh-bullet">'),
    semanticLists: (html) => html.includes('<ul>') && html.includes('<li>'),
    bibliographyFormat: (html) => html.includes('<ol class="bibliography">')
  },
  monograph: {
    noEndMarkers: (text) => !text.includes('END') && !text.includes('>>END'),
    properHeaders: (text) => !text.includes('Understanding of'),
    bibliographyHeading: (text) => text.includes('Bibliography') && !text.includes('>>BIBLIOGRAPHY')
  }
};
```

## Performance Benchmarks

Expected generation times:
- **Enhanced PDF**: 20-30 seconds
- **Monograph PDF**: 15-25 seconds
- If >45 seconds: Check for infinite loops or memory issues

## Quick Production Test

```bash
# Test Enhanced with V2 formatting
curl -X POST https://painoptix-clean-9n639.ondigitalocean.app/api/download-guide \
  -H "Content-Type: application/json" \
  -H "x-po-enhanced-v2: 1" \
  -d '{"assessmentId":"admin-test-sciatica","tier":"enhanced"}' \
  -o test-enhanced-v2.pdf

# Test Monograph
curl -X POST https://painoptix-clean-9n639.ondigitalocean.app/api/download-guide \
  -H "Content-Type: application/json" \
  -d '{"assessmentId":"admin-test-si_joint","tier":"monograph"}' \
  -o test-monograph.pdf
```

## Visual Inspection Checklist

### Professional Appearance
- [ ] Clean, consistent fonts
- [ ] Proper spacing between sections
- [ ] No overlapping text
- [ ] Headers properly sized
- [ ] Bullets aligned correctly

### Content Integrity
- [ ] All sections present
- [ ] No missing content
- [ ] Bibliography properly formatted
- [ ] No debug text or markers
- [ ] Page breaks at logical points

### Technical Correctness
- [ ] File size appropriate (Enhanced: ~200KB, Monograph: ~5MB)
- [ ] PDF opens in all viewers
- [ ] Text is selectable
- [ ] Links are clickable (if present)
- [ ] Print preview looks correct

## Regression Test Schedule

### Daily Tests (if making PDF changes)
1. Generate one Enhanced PDF
2. Generate one Monograph PDF
3. Visual inspection for known issues

### Before Each Deployment
1. Full test suite (all conditions)
2. Production curl tests
3. Compare with baseline PDFs
4. Team review of any changes

### Monthly Maintenance
1. Review this guide for updates
2. Update test cases if new issues found
3. Archive baseline PDFs for comparison

## Contact for Issues
- PDF generation issues: Check puppeteer-generator.ts first
- Styling problems: Review styles.ts and CSS rules
- Content issues: Check markdown source files
- Build failures: Review Docker logs on DigitalOcean

Last Updated: August 15, 2025