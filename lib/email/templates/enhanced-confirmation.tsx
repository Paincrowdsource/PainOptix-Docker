export function getEnhancedConfirmationTemplate(ctx: { assessmentResults: any; userTier?: string }) {
  const { assessmentResults, userTier } = ctx;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #718096; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .success-box { background: #f0fff4; border-left: 4px solid #48bb78; padding: 15px; margin: 20px 0; }
    .feature-list { background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Enhanced Educational Report is Ready</h1>
    </div>
    <div class="content">
      <div class="success-box">
        <strong>✓ Purchase Confirmed</strong><br>
        Thank you for your purchase. Your Enhanced Educational Report has been generated and is attached to this email.
      </div>

      <h2>What's Included in Your Enhanced Educational Report</h2>
      <div class="feature-list">
        <ul>
          <li><strong>Detailed Educational Analysis:</strong> In-depth educational information about ${assessmentResults?.diagnosis || 'your topic'} with anatomical context</li>
          <li><strong>Research Bibliography:</strong> Curated references from peer-reviewed research literature</li>
          <li><strong>Educational Information About Management:</strong> Comprehensive overview of evidence-based educational approaches</li>
          <li><strong>Terminology Educational Guide:</strong> Professional terms explained in accessible language</li>
          <li><strong>Educational Guidelines:</strong> Current educational information from leading organizations</li>
        </ul>
      </div>

      <h3>How to Use Your Enhanced Educational Report</h3>
      <ol>
        <li>Review the detailed educational analysis section to learn about your topic</li>
        <li>Share relevant educational sections with your healthcare provider during consultations</li>
        <li>Use the bibliography to explore specific educational topics in more depth</li>
        <li>Reference the terminology guide when discussing your topic</li>
      </ol>

      ${userTier !== 'monograph' ? `
      <h3>Additional Educational Resources Available</h3>
      <p>Your Enhanced Educational Report provides comprehensive educational information about ${assessmentResults?.diagnosis || 'your topic'}. For those seeking even more educational depth, our Complete Educational Monograph includes:</p>
      <ul>
        <li>High-resolution educational illustrations and imaging guides</li>
        <li>Extended educational case studies and examples</li>
        <li>Educational progress timeline information</li>
        <li>Healthcare provider communication educational templates</li>
      </ul>
      ` : ''}

      <p>We'll check in with you in a few days to see how you're doing with the information provided.</p>

      <div class="footer">
        <p><strong>Educational Disclaimer:</strong> This material is provided for educational and informational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified healthcare provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read in this educational material.</p>
        <p>© ${new Date().getFullYear()} PainOptix. All rights reserved.</p>
        <p>To manage your email preferences, <a href="${process.env.NEXT_PUBLIC_APP_URL}/preferences">click here</a>.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}