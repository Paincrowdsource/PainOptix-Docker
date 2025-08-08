# PainOptix Project Content Context (`CLAUDE.MD`)

### 1. PROJECT OVERVIEW
- PainOptix is a medical education platform that generates personalized pain assessment reports
- Three pricing tiers: FREE ($0), ENHANCED ($5), MONOGRAPH ($20)
- Built with Next.js 15, Supabase, Stripe, TypeScript
- Staging: painoptixstaging.netlify.app
- Production: Not yet launched

### 2. ARCHITECTURE DECISIONS
- PDF Generation: Use ONLY `lib/pdf/final-renderer.ts` - all other renderers are deprecated
- Database: Supabase with Row Level Security
- Payments: Stripe checkout with webhook handling
- Email: SendGrid
- SMS: Twilio
- Deployment: Netlify with environment variables

### 3. CRITICAL BUSINESS LOGIC
- Assessment flow: User takes assessment → Saved to DB → Payment (if not free) → PDF generated → Email sent
- Content hierarchy: FREE (basic info) → ENHANCED (clinical guide) → MONOGRAPH (comprehensive medical document)
- PDF must maintain professional medical document standards with Dr. Carpentier's branding

### 4. CONTENT STRUCTURE REQUIREMENTS

#### Enhanced Tier Markdown MUST have:
```yaml
---
title: Condition Name
subtitle: Enhanced Clinical Guide
---

>>EXECUTIVE_SUMMARY
Summary text here
>>END

>>KEY_POINTS
- Point 1
- Point 2
>>END

## Regular markdown content...
Monograph Tier:

Full markdown with bibliography
May contain [Name Placeholder] and [Date Placeholder] that must be replaced

5. PDF RENDERING RULES

ALWAYS use generatePainOptixPdf from lib/pdf/final-renderer.ts
Required features: Blue headers, professional cover page, info boxes, Times font for body
Content width: 168mm (with 2mm safety buffer)
Must handle: Headers (##), Subheaders (###), Bold (text), Bullets (- or •)

6. COMMON PITFALLS & SOLUTIONS

If PDF has no styling → Wrong renderer being used
If text overflows → Check CONTENT_WIDTH buffer
If placeholders show → Not replaced in API route
If no blue headers → Markdown missing YAML frontmatter

7. TESTING CHECKLIST
Before ANY PDF changes:

Test all 3 tiers for same condition
Verify blue headers appear
Check cover page renders properly
Ensure no text overflow
Confirm bibliography formatting (monograph only)

8. FILE OWNERSHIP

lib/pdf/final-renderer.ts - THE ONLY PDF RENDERER (never create alternatives)
app/api/download-guide/route.ts - Must use final-renderer
content/guides/[tier]/*.md - Content files requiring specific structure
app/components/AssessmentForm.tsx - Contains SMS opt-in logic

9. ENVIRONMENT VARIABLES
List all required env vars and their purposes...
10. CLIENT REQUIREMENTS

Dr. Bradley W. Carpentier, MD - Board-certified pain management specialist
Business entity: Dr. C. Pain MD Holdings, LLC
Must maintain professional medical document standards
SMS/Email follow-up system critical for patient engagement

11. COMMANDS & SHORTCUTS

Generate test PDFs: Use admin mode with specific guide type and tier
Test Stripe: Use test card 4242424242424242
Check PDF: Always verify in actual PDF reader, not browser preview

12. NEVER DO THIS

Create new PDF renderers
Modify jspdf-generator.ts or layout.ts (deprecated)
Use localStorage in artifacts
Change business entity name
Remove Dr. Carpentier attribution

Append any project-specific patterns, conventions, and lessons learned discovered during analysis