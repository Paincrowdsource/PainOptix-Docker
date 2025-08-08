# EducationalGuideContentStructure

## DirectoryStructure
- `/free/` - Basiceducationalguides (includedwithassessment)
- `/enhanced/` - $5enhancedguides (detailedinformation)
- `/monograph/` - $20comprehensivemonographs

## FileNamingConventionFilesshouldbenamedexactlyastheguidetypes:
- sciatica.md
- upper_lumbar_radiculopathy.md
- si_joint_dysfunction.md
- canal_stenosis.md
- central_disc_bulge.md
- facet_arthropathy.md
- muscular_nslbp.md
- lumbar_instability.md
- urgent_symptoms.md

## PDFConversionWhenBradleysendsPDFs, use:
```bashnpmrunpdf2md -- --input "path/to/pdf" --output "content/guides/enhanced/sciatica.md"
```

## ContentFormatEachmarkdownfileshouldhave:
```markdown
- --
title: "SciaticaEducationalGuide"
tier: "enhanced" # or "monograph"
price: 5 # or20
- --

# Contentgoeshere
```
