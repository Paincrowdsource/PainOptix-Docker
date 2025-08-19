export function getMonographConfirmationTemplate(ctx: { assessmentResults: any; userTier?: string }) {
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
    .premium-box { background: linear-gradient(135deg, #f6f8fb 0%, #f0f4f8 100%); border: 2px solid #667eea; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .success-box { background: #f0fff4; border-left: 4px solid #48bb78; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Complete Educational Monograph</h1>
    </div>
    <div class="content">
      <div class="success-box">
        <strong>✓ Premium Purchase Confirmed</strong><br>
        Your comprehensive educational monograph for ${assessmentResults?.diagnosis || 'your topic'} is attached to this email.
      </div>

      <div class="premium-box">
        <h2>Your Complete Educational Monograph Includes:</h2>
        <ul>
          <li><strong>Educational Illustrations:</strong> High-resolution anatomical diagrams for educational purposes about your topic</li>
          <li><strong>Educational Imaging Guide:</strong> Educational information about understanding X-rays, MRIs, and CT scans</li>
          <li><strong>Complete Educational Analysis:</strong> All evidence-based educational information about management approaches</li>
          <li><strong>Educational Case Studies:</strong> Real-world educational examples and outcomes</li>
          <li><strong>Educational Progress Timeline:</strong> Expected educational milestones and progress indicators</li>
          <li><strong>Provider Discussion Educational Guide:</strong> Educational questions and talking points for healthcare consultations</li>
          <li><strong>Educational Research Compendium:</strong> Extensive bibliography with key study summaries for educational purposes</li>
          <li><strong>Lifestyle Educational Integration:</strong> Comprehensive educational information about activity modifications and ergonomic recommendations</li>
        </ul>
      </div>

      <h3>Making the Most of Your Educational Monograph</h3>
      <ol>
        <li><strong>Start with the Executive Summary</strong> for a quick overview of key educational findings</li>
        <li><strong>Review the educational illustrations</strong> to better understand the anatomical educational aspects</li>
        <li><strong>Use the Provider Discussion Educational Guide</strong> at your next appointment</li>
        <li><strong>Track your educational progress</strong> using the educational timeline section</li>
        <li><strong>Reference the educational analysis</strong> when learning about different approaches</li>
      </ol>

      <h3>Additional Educational Support Available</h3>
      <p>As an educational monograph purchaser, you have access to our most comprehensive educational materials. Some users find additional value in:</p>
      <ul>
        <li><strong>Personalized Educational Support:</strong> One-on-one guidance for understanding educational recommendations</li>
        <li><strong>Quarterly Educational Updates:</strong> Latest research and educational advances for your topic</li>
        <li><strong>Provider Network Educational Access:</strong> Connect with specialists familiar with your educational topic</li>
      </ul>

      <p>We'll follow up in about a week to see how you're progressing with the material and answer any questions.</p>

      <h3>Important Educational Resources</h3>
      <p>Your educational monograph PDF is attached to this email (file size: approximately 5-9MB). Please save it for future educational reference.</p>
      
      <p>If you have any issues accessing your educational monograph, please contact us immediately at support@painoptix.com</p>

      <div class="footer">
        <p><strong>Educational Disclaimer:</strong> This material is provided for educational and informational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified healthcare provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read in this educational material.</p>
        <p>© ${new Date().getFullYear()} PainOptix. All rights reserved.</p>
        <p>To manage your preferences, <a href="${process.env.NEXT_PUBLIC_APP_URL}/preferences">visit your account</a>.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}