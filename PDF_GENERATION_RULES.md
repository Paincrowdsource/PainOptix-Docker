# PDF Generation Rules - DO NOT MODIFY WITHOUT TEAM REVIEW

## Critical Settings (NEVER CHANGE)
Last Updated: August 15, 2025
Violations of these rules will break PDF generation.

### Puppeteer Configuration
```javascript
// REQUIRED settings for all PDF tiers
{
  format: 'Letter',        // NOT 'A4'
  margin: {
    top: '1in',           // Must be 1in
    right: '1in',         // Must be 1in
    bottom: '1in',        // Must be 1in
    left: '1in'           // Must be 1in
  },
  printBackground: true,
  // DO NOT ADD: scale, preferCSSPageSize, or any other parameters
}
```

## Enhanced PDF Rules

### transformLists() - PERMANENTLY DISABLED
```javascript
// This line must remain commented:
// contentAsHtml = transformLists(contentAsHtml); // DISABLED - breaks list formatting
```

- This function converted `<ul>`/`<li>` to `<p class="enh-bullet">`
- Caused bullets to separate from content
- Caused bibliography numbers to orphan
- Fixed: August 15, 2025
- DO NOT RE-ENABLE

### Semantic HTML Requirements
- Lists must remain as `<ul>`, `<ol>`, `<li>`
- Do not convert to custom classes
- Use CSS for styling, not HTML transformation

## Monograph PDF Rules

### stripEndMarkers() - REQUIRED
```javascript
function stripEndMarkers(md: string): string {
  // Removes: END, [END], >>END
  md = md.replace(/(^|\n)\s*(\[\s*END\s*\]|END|>>END)\s*(?=\n|$)/g, '\n');
  // Converts >>BIBLIOGRAPHY to ## Bibliography
  md = md.replace(/^\s*>>\s*BIBLIOGRAPHY\s*$/gmi, '## Bibliography');
  return md;
}
```

- Must be called on all monograph content
- Removes content sentinels before HTML conversion
- Fixed: August 15, 2025

## CSS Rules
- No hanging indents for bibliography
- text-align: left (no justification)
- No word-break: break-all
- No overflow: hidden on content elements

## Testing Requirements
Before deploying ANY PDF changes:

### Enhanced PDFs
1. ✅ Generate Sciatica Enhanced
   - Verify bullets stay with content
   - Verify "Physical Exam:" bullet formatting
   - Check bibliography numbers on same line

2. ✅ Generate Facet Arthropathy Enhanced
   - Verify all bullets properly formatted
   - Check bibliography formatting

### Monograph PDFs
1. ✅ Generate SI Joint Dysfunction
   - Verify NO "END" text anywhere
   - Verify "Bibliography" heading (not >>BIBLIOGRAPHY)

2. ✅ Generate Facet Arthropathy Monograph
   - Verify "Understanding Back Discomfort" (no "of")

### All PDFs
- ✅ No text cutoff on right edge
- ✅ No weird word spacing
- ✅ Professional appearance maintained

## Common Mistakes to Avoid
1. "Let me optimize the margins" → NO, they're correct at 1"
2. "transformLists seems useful" → NO, it breaks formatting
3. "Let's add scale: 0.95" → NO, causes text cutoff
4. "A4 is more standard" → NO, we use Letter format
5. "These END markers look wrong" → They're removed by stripEndMarkers()

## If You Need to Change PDF Generation
1. Read this entire document
2. Read PDF_GENERATION_ACTUAL.md
3. Test ALL PDF types (Enhanced + Monograph)
4. Get code review from team lead
5. Document why the change is needed