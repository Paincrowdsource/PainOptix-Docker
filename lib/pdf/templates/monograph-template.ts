export function getMonographTemplate(htmlContent: string, assessment: any) {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <base href="${process.env.NODE_ENV === 'development' && !process.env.NETLIFY ? 'http://localhost:3000/' : (process.env.NEXT_PUBLIC_APP_URL || 'https://painoptix-clean-9n639.ondigitalocean.app') + '/'}">
  <style>
    /* Bradley's $20 Monograph Formatting */
    @page {
      size: A4;
      margin: 1in;
    }

    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #000;
      background-color: #ffffff;
      max-width: 6.5in;
      margin: 0 auto;
    }

    /* Title - centered, bold, larger */
    h1, .title {
      font-size: 14pt;
      font-weight: bold;
      text-align: center;
      margin: 0 0 0.5em 0;
      page-break-after: avoid;
    }

    /* Subtitle */
    h2:first-of-type, .subtitle {
      font-size: 12pt;
      font-weight: bold;
      text-align: center;
      margin: 0 0 1em 0;
      page-break-after: avoid;
    }

    /* Metadata section */
    .metadata {
      margin-bottom: 1.5em;
    }

    .metadata p {
      margin: 0.3em 0;
    }

    /* Section headings - bold, slightly larger */
    h2, h3, .section-heading {
      font-size: 12pt;
      font-weight: bold;
      margin: 1.5em 0 0.5em 0;
      page-break-after: avoid;
    }

    /* Regular paragraphs */
    p {
      margin: 0 0 0.6em 0;
      text-align: justify;
      text-justify: inter-word;
    }

    /* Bullet points */
    ul {
      margin: 0.5em 0 1em 0;
      padding-left: 0.5in;
    }

    li {
      margin-bottom: 0.3em;
      text-align: justify;
    }

    /* Strong text within paragraphs */
    p strong {
      font-weight: bold;
    }

    /* References/Bibliography section */
    .bibliography {
      margin-top: 2em;
      page-break-before: always;
    }

    .bibliography h2 {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 1em;
    }

    .bibliography ol {
      padding-left: 0.5in;
    }

    .bibliography li {
      margin-bottom: 0.5em;
      text-align: left;
    }

    /* Notice/Disclaimer */
    .notice {
      margin-top: 2em;
      padding-top: 1em;
      border-top: 1px solid #000;
      font-size: 10pt;
      font-style: italic;
    }

    /* Page breaks */
    .page-break {
      page-break-after: always;
    }

    /* Ensure sections don't break awkwardly */
    h1, h2, h3, h4 {
      page-break-after: avoid;
    }

    p {
      orphans: 3;
      widows: 3;
    }

    /* Placeholder styling */
    .placeholder {
      background-color: #ffff99;
      padding: 0 2px;
    }

    /* Image styling for exercises and anatomical diagrams */
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1em auto;
      page-break-inside: avoid;
    }

    /* Exercise images - optimized for PDF size */
    img[alt*="exercise"], 
    img[alt*="Exercise"],
    img[alt*="stretch"],
    img[alt*="Stretch"],
    img[src*="/exercises/"] {
      max-width: 300px;  /* Reduced from 400px */
      width: 100%;
      /* Removed box-shadow and border to eliminate visible edges */
      background-color: transparent;  /* Let the image's own white show through */
    }

    /* Anatomical diagrams - optimized for PDF size */
    img[alt*="Anatomical"],
    img[alt*="anatomical"],
    img[alt*="diagram"],
    img[src*="/anatomical/"] {
      max-width: 350px;  /* Reduced from 500px */
      width: 100%;
      /* Removed box-shadow and border to eliminate visible edges */
      background-color: transparent;  /* Let the image's own white show through */
    }
    
    /* Removed specific Supine Abdominal Bracing fix - no longer needed */

    /* Ensure images don't break across pages */
    @media print {
      img {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <h1>PainOptix™ ${assessment.diagnosis_name || '[Condition]'} Monograph</h1>
  <h2>${assessment.diagnosis_name || '[Condition]'}-Dominant Pattern Edition</h2>
  
  <div class="metadata">
    <p><strong>Created for</strong>: ${assessment.name || '[Name Placeholder]'}</p>
    <p><strong>Date</strong>: ${currentDate}</p>
  </div>

  ${htmlContent}
</body>
</html>
  `;
}