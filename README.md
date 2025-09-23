# PainOptix Docker Deployment

This repository is specifically configured for Docker deployment on DigitalOcean.

## ⚠️ CRITICAL SYSTEMS - READ BEFORE MODIFYING

### PDF Generation System
⛔ DO NOT MODIFY without reading:
- **PDF_GENERATION_RULES.md** - Critical rules and settings
- **PDF_GENERATION_ACTUAL.md** - Implementation details
- **TESTING_GUIDE.md** - Required test cases

**Recent Critical Fixes (August 15, 2025):**
- Enhanced PDFs: Disabled transformLists() to fix bullet/bibliography formatting
- Monograph PDFs: Added stripEndMarkers() to remove content artifacts
- All PDFs: Standardized on Letter format with 1" margins (no scaling)

**Known Issues (FIXED - Do Not Reintroduce):**
- ❌ DON'T enable transformLists() - it breaks list formatting
- ❌ DON'T add scale parameters - causes text cutoff
- ❌ DON'T change from Letter format - breaks layout
- ❌ DON'T modify 1" margins - causes content overflow
- ❌ DON'T remove stripEndMarkers() - END text will appear

**Quick Test Command:**
```bash
npm run test:pdfs
```

## Important Note
This repository does NOT contain package.json or package-lock.json at the root level.
Instead, the Dockerfile creates these files during the build process.

This approach ensures DigitalOcean uses Docker instead of Node.js buildpack.

## Deployment
The app is configured to deploy automatically via DigitalOcean App Platform using Docker. 
