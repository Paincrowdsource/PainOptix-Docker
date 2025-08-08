export function getEnhancedTemplate(htmlContent: string, assessment: any) {
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
    /* Bradley's $5 Enhanced Report Formatting */
    @page {
      size: A4;
      margin: 0.75in;
    }

    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #000;
      margin: 0;
      padding: 0;
    }

    /* Title - bold, left-aligned for reports */
    h1, .title {
      font-size: 13pt;
      font-weight: bold;
      margin: 0 0 0.5em 0;
      page-break-after: avoid;
    }

    /* Metadata section */
    .metadata {
      margin-bottom: 1em;
    }

    .metadata p {
      margin: 0.2em 0;
      font-size: 10pt;
    }

    /* Section headings - numbered, bold */
    h2, .section-heading {
      font-size: 11pt;
      font-weight: bold;
      margin: 1em 0 0.4em 0;
      page-break-after: avoid;
    }

    /* Regular paragraphs - more compact than monograph */
    p {
      margin: 0 0 0.5em 0;
      text-align: left;
      word-wrap: normal;
      word-break: normal;
      white-space: normal;
    }

    /* Bullet points - more compact */
    ul {
      margin: 0.3em 0 0.8em 0;
      padding-left: 0.4in;
    }

    li {
      margin-bottom: 0.2em;
    }

    /* Links */
    a {
      color: #0066cc;
      text-decoration: underline;
    }

    /* Upsell section - highlighted */
    .upsell {
      background-color: #f0f8ff;
      border: 1px solid #0066cc;
      padding: 0.5em;
      margin: 1em 0;
      border-radius: 4px;
    }

    .upsell h2 {
      color: #0066cc;
      margin-top: 0;
    }

    .discount-code {
      font-weight: bold;
      color: #cc0000;
      font-size: 12pt;
    }

    /* References - compact format */
    .references {
      margin-top: 1.5em;
      font-size: 10pt;
    }

    .references h2 {
      font-size: 11pt;
      margin-bottom: 0.5em;
    }

    .references ol {
      padding-left: 0.4in;
      margin: 0;
    }

    .references li {
      margin-bottom: 0.3em;
    }

    /* Disclaimer */
    .disclaimer {
      margin-top: 1.5em;
      padding-top: 0.5em;
      border-top: 1px solid #666;
      font-size: 9pt;
      font-style: italic;
      color: #666;
    }

    /* Red flags - important styling */
    .red-flags {
      background-color: #fff0f0;
      border-left: 3px solid #cc0000;
      padding: 0.5em;
      margin: 0.5em 0;
    }

    /* Placeholder styling */
    .placeholder {
      background-color: #ffff99;
      padding: 0 2px;
    }

    /* Strong text */
    strong {
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>PainOptix™ ${assessment.diagnosis_name || '[Condition]'} Report</h1>
  
  <div class="metadata">
    <p><strong>Prepared for:</strong> ${assessment.name || '[Name]'}</p>
    <p><strong>Condition:</strong> ${assessment.diagnosis_name || '[Condition]'}</p>
    <p><strong>Date:</strong> ${currentDate}</p>
  </div>

  ${htmlContent}
</body>
</html>
  `;
}