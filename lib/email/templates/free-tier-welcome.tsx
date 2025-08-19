export function getFreeTierWelcomeTemplate(ctx: { assessmentResults: any; userTier?: string }) {
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
    .diagnosis-box { background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .warning { background: #fff5f5; border-left: 4px solid #fc8181; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your PainOptix Educational Assessment</h1>
    </div>
    <div class="content">
      <p>Thank you for completing your PainOptix educational assessment. Based on your responses, we've prepared educational materials to help you learn about back discomfort and related topics.</p>
      
      <div class="diagnosis-box">
        <h2>Your Assessment Summary</h2>
        <p><strong>Educational Topic:</strong> ${assessmentResults?.diagnosis || 'Back Discomfort'}</p>
        <p><strong>Discomfort Level:</strong> ${assessmentResults?.severity || 'Moderate'}</p>
        <p><strong>Duration:</strong> ${assessmentResults?.duration || 'Not specified'}</p>
      </div>

      <h2>Your Free Educational Guide</h2>
      <p>We've prepared a comprehensive educational guide that covers:</p>
      <ul>
        <li>Understanding your specific educational topic</li>
        <li>Evidence-based educational information about management approaches</li>
        <li>When to seek professional healthcare consultation</li>
        <li>Lifestyle educational information that may be relevant</li>
        <li>Movement and activity educational resources</li>
      </ul>

      <p>Your educational guide has been sent to this email address. Please check your inbox for the PDF attachment.</p>

      ${userTier === 'free' ? `
      <h3>Want More Detailed Educational Information?</h3>
      <p>Our Enhanced Educational Report ($5) provides:</p>
      <ul>
        <li>Detailed anatomical educational content</li>
        <li>Comprehensive bibliography of research literature</li>
        <li>Extended educational information about management approaches</li>
        <li>Professional terminology educational explanations</li>
      </ul>

      <p>Our Complete Educational Monograph ($20) includes everything above plus:</p>
      <ul>
        <li>High-resolution educational illustrations</li>
        <li>Complete educational imaging guide</li>
        <li>Healthcare provider discussion educational points</li>
        <li>Educational timeline information</li>
        <li>Progress tracking educational resources</li>
      </ul>

      <a href="${process.env.NEXT_PUBLIC_APP_URL}/upgrade?assessment=${assessmentResults?.assessmentId}" class="button">
        Explore Additional Educational Options
      </a>
      ` : ''}

      <div class="footer">
        <p><strong>Educational Disclaimer:</strong> This material is provided for educational and informational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified healthcare provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read in this educational material.</p>
        <p>© ${new Date().getFullYear()} PainOptix. All rights reserved.</p>
        <p>To stop receiving these emails, <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe">click here</a>.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}