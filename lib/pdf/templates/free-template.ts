export function getFreeTemplate(htmlContent: string, assessment: any) {
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
  <style>
    /* Free Tier - Simple, clean formatting */
    @page {
      size: A4;
      margin: 1in;
    }

    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #333;
      max-width: 6.5in;
      margin: 0 auto;
    }

    /* Title */
    h1 {
      font-size: 14pt;
      font-weight: normal;
      text-align: center;
      margin: 0 0 1em 0;
      color: #000;
    }

    /* Basic metadata */
    .metadata {
      text-align: center;
      margin-bottom: 1.5em;
      font-size: 10pt;
      color: #666;
    }

    /* Section headings */
    h2 {
      font-size: 12pt;
      font-weight: bold;
      margin: 1.2em 0 0.4em 0;
      color: #000;
    }

    /* Paragraphs - simple */
    p {
      margin: 0 0 0.5em 0;
      text-align: left;
    }

    /* Lists - basic */
    ul {
      margin: 0.5em 0;
      padding-left: 1.5em;
    }

    li {
      margin-bottom: 0.2em;
    }

    /* Call to action */
    .cta {
      text-align: center;
      margin: 2em 0;
      padding: 1em;
      background-color: #f9f9f9;
      border: 1px solid #ddd;
    }

    .cta p {
      margin: 0.5em 0;
      font-size: 10pt;
    }

    /* Footer */
    .footer {
      margin-top: 2em;
      padding-top: 1em;
      border-top: 1px solid #ddd;
      font-size: 9pt;
      color: #666;
      text-align: center;
    }

    /* Links */
    a {
      color: #0066cc;
    }

    /* Placeholder */
    .placeholder {
      background-color: #ffff99;
    }
  </style>
</head>
<body>
  <h1>PainOptix™ Educational Guide</h1>
  
  <div class="metadata">
    <p>${assessment.diagnosis_name || '[Condition]'} Information</p>
    <p>${currentDate}</p>
  </div>

  ${htmlContent}

  <div class="cta">
    <p><strong>Want more detailed information?</strong></p>
    <p>Upgrade to our Enhanced Report or Comprehensive Monograph for personalized strategies, exercise programs, and recovery tracking tools.</p>
  </div>

  <!-- Disclaimer moved to page footer via CSS @page rule -->
</body>
</html>
  `;
}