# Educational Guide Content Structure

## Directory Structure
- `/free/` — Basic educational guides (legacy, not actively served)
- `/enhanced/` — Enhanced guides (legacy, not actively served)
- `/monograph/` — Comprehensive monographs (active — all users receive this tier)

## File Naming Convention
Files should be named exactly as the guide types:
- sciatica.md
- upper_lumbar_radiculopathy.md
- si_joint_dysfunction.md
- canal_stenosis.md
- central_disc_bulge.md
- facet_arthropathy.md
- muscular_nslbp.md
- lumbar_instability.md
- urgent_symptoms.md

## PDF Conversion
When Bradley sends PDFs, use:
```bash
npm run pdf2md -- --input "path/to/pdf" --output "content/guides/monograph/sciatica.md"
```

## Content Format
Each markdown file should have frontmatter:
```markdown
---
title: "Sciatica Educational Guide"
tier: "monograph"
---

# Content goes here
```
