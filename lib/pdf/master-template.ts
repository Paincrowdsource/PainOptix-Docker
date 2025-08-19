export function getPdfHtmlTemplate(
  contentAsHtml: string, 
  assessment: any,
  tier: 'free' | 'enhanced' | 'monograph',
  frontmatter: any = {}
): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });

  // Premium medical document styling based on Bradley's .docx files
  const cssStyles = `
    /* --- UNIVERSAL PREMIUM STYLES --- */
    @page {
      size: A4;
      margin: 1in;
    }

    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #333;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }

    /* Headers - Medical Blue */
    h1, h2, h3, h4 {
      font-family: Arial, sans-serif;
      color: #1a5490;
      margin-top: 24pt;
      margin-bottom: 12pt;
      font-weight: bold;
    }

    h1 {
      font-size: 18pt;
      border-bottom: 2px solid #1a5490;
      padding-bottom: 6pt;
    }

    h2 {
      font-size: 14pt;
      border-bottom: 1px solid #1a5490;
      padding-bottom: 4pt;
    }

    h3 {
      font-size: 12pt;
      font-weight: bold;
    }

    /* Paragraphs */
    p {
      margin: 0 0 12pt 0;
      text-align: justify;
      text-indent: 0;
    }

    /* Lists */
    ul, ol {
      margin: 0 0 12pt 0;
      padding-left: 36pt;
    }

    li {
      margin-bottom: 6pt;
      line-height: 1.6;
    }

    /* Special sections */
    .cover-page {
      text-align: center;
      padding-top: 3in;
      page-break-after: always;
    }

    .cover-title {
      font-size: 24pt;
      font-weight: bold;
      color: #1a5490;
      margin-bottom: 24pt;
    }

    .key-points {
      background-color: #e8f2ff;
      border: 1px solid #1a5490;
      padding: 12pt;
      margin: 12pt 0;
      border-radius: 4pt;
    }

    .bibliography {
      font-size: 10pt;
      line-height: 1.4;
      margin: 0;
      padding-left: 1.5rem;
      list-style: decimal;
      word-break: keep-all;
      overflow-wrap: normal;
      hyphens: none;
    }
    
    .bibliography li {
      margin-bottom: 0.6rem;
      list-style-position: outside;
      display: list-item;
    }
    
    .bibliography .norun {
      display: inline-block;
      white-space: nowrap;
    }
    
    .bibliography .doi {
      white-space: nowrap;
    }

    /* Tier-specific styling */
    .tier-badge {
      display: inline-block;
      padding: 4pt 12pt;
      border-radius: 4pt;
      font-weight: bold;
      margin-top: 12pt;
    }

    .tier-enhanced {
      background-color: #2c7fb8;
      color: white;
    }

    .tier-monograph {
      background-color: #1a5490;
      color: white;
    }

    /* Image constraints for proper sizing */
    img {
      max-width: 300px !important;
      max-height: 300px !important;
      width: auto !important;
      height: auto !important;
      display: block !important;
      margin: 20px auto !important;
      page-break-inside: avoid;
      object-fit: contain;
    }
    
    /* Exercise images should be slightly smaller */
    .exercise-section img,
    p > img {
      max-width: 250px !important;
      max-height: 250px !important;
      margin: 15px auto !important;
    }
    
    /* Anatomical diagrams can be slightly larger */
    h1 + p > img,
    h2 + p > img,
    h3 + p > img {
      max-width: 350px !important;
      max-height: 350px !important;
    }
  `;

  // Enhanced-specific CSS for hanging bullets and text control
  const enhancedCss = tier === 'enhanced' ? `
    /* Enhanced tier hanging-bullet paragraphs */
    .enh-bullet {
      display: flex;
      page-break-inside: avoid;
      margin: 0 0 12pt 0;
    }
    
    .enh-bullet .dot {
      flex: 0 0 16pt;
      font-weight: normal;
    }
    
    .enh-bullet .txt {
      flex: 1;
      text-align: justify;
      hyphens: auto;
    }
    
    /* Citation and phrase gluing */
    .cite, .nowrap, .glue {
      white-space: nowrap;
      display: inline-block;
    }
    
    /* Bibliography formatting */
    .bib {
      margin-top: 12pt;
    }
    
    .bib-item {
      margin: 6pt 0;
      line-height: 1.35;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    /* Disable link href printing */
    @media print {
      a[href]::after {
        content: none !important;
      }
    }
  ` : '';

  const tierBadge = tier === 'monograph' ? 
    '<span class="tier-badge tier-monograph">COMPREHENSIVE MONOGRAPH</span>' :
    tier === 'enhanced' ?
    '<span class="tier-badge tier-enhanced">ENHANCED CLINICAL GUIDE</span>' :
    '';

  // Build heading based on tier and guide type
  const getHeading = () => {
    if (tier === 'enhanced') {
      // Map guide types to proper headings
      const headingMap: Record<string, string> = {
        facet_arthropathy: 'Facet Arthropathy',
        central_disc_bulge: 'Central Disc Bulge',
        canal_stenosis: 'Canal Stenosis',
        lumbar_instability: 'Lumbar Instability',
        muscular_nslbp: 'Muscular / NSLBP',
        upper_lumbar_radiculopathy: 'Upper Lumbar Radiculopathy',
        si_joint_dysfunction: 'SI Joint Dysfunction',
        urgent_symptoms: 'Urgent Symptoms',
        sciatica: 'Sciatica'
      };
      const condition = headingMap[assessment.guide_type] || headingMap[assessment.guideType] || 'Your Back Pain';
      return `Learn About ${condition}`;
    }
    return frontmatter.title || (assessment.guideType ? assessment.guideType.replace(/_/g, ' ').toUpperCase() : 'ASSESSMENT GUIDE');
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <base href="${process.env.NODE_ENV === 'development' && !process.env.NETLIFY ? 'http://localhost:3000/' : 'https://painoptixstaging.netlify.app/'}">
        <meta charset="utf-8" />
        <style>${cssStyles}${enhancedCss}</style>
      </head>
      <body>
        <div class="cover-page">
          <h1 class="cover-title">${getHeading()}</h1>
          ${tier === 'enhanced' ? '<p>Thank you for using PainOptix™ to better understand your back pain. This Enhanced Clinical Guide provides detailed, evidence-based information about your condition.</p>' : ''}
          ${frontmatter.subtitle && tier !== 'enhanced' ? `<h2>${frontmatter.subtitle}</h2>` : ''}
          ${tierBadge}
          <p style="margin-top: 48pt;">
            <strong>Prepared for:</strong> ${assessment.name || 'Patient'}<br/>
            <strong>Date:</strong> ${currentDate}<br/>
            <strong>Initial Pain Score:</strong> ${assessment.initialPainScore || assessment.initial_pain_score || 'N/A'}/10
          </p>
          <p style="position: absolute; bottom: 1in; left: 0; right: 0; text-align: center; font-size: 10pt;">
            Developed by Bradley W. Carpentier, MD<br/>
            Board Certified Pain Management Specialist
          </p>
        </div>
        ${contentAsHtml}
      </body>
    </html>
  `;
}