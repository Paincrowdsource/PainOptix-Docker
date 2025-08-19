export function getRedFlagWarningTemplate(ctx: { assessmentResults: any; userTier?: string }) {
  const { assessmentResults, userTier } = ctx;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: white; padding: 30px; border: 2px solid #dc2626; border-radius: 0 0 10px 10px; }
    .urgent-box { background: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .warning-list { background: #fff5f5; padding: 20px; margin: 20px 0; border-left: 4px solid #dc2626; }
    .footer { text-align: center; color: #718096; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    h2 { color: #dc2626; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Important: Healthcare Consultation Recommended</h1>
    </div>
    <div class="content">
      <div class="urgent-box">
        <h2>Immediate Action Recommended</h2>
        <p><strong>Based on your educational assessment responses, we've identified symptoms that educational resources suggest may warrant prompt healthcare professional evaluation.</strong></p>
        <p>Please contact your healthcare provider immediately or visit an emergency department if you're experiencing severe symptoms.</p>
      </div>

      <div class="warning-list">
        <h3>Why This Educational Information Is Important</h3>
        <p>Your responses indicate one or more of the following symptoms that educational resources suggest may be concerning:</p>
        <ul>
          <li>Progressive neurological symptoms</li>
          <li>Loss of bowel or bladder control</li>
          <li>Severe or worsening weakness</li>
          <li>Unexplained weight loss with back pain</li>
          <li>Fever accompanying back pain</li>
          <li>History of cancer with new back pain</li>
          <li>Severe pain following trauma</li>
        </ul>
        <p>Educational resources suggest these symptoms may indicate conditions that could benefit from immediate healthcare professional evaluation.</p>
      </div>

      <h3>What Educational Resources Suggest You Should Do</h3>
      <ol>
        <li><strong>Contact your healthcare provider immediately</strong> - Call your primary care physician or specialist today</li>
        <li><strong>If you cannot reach your healthcare provider</strong> - Visit an urgent care center or emergency department</li>
        <li><strong>Bring this educational information</strong> - Share your symptoms and this educational assessment with your healthcare provider</li>
        <li><strong>Do not delay</strong> - Educational resources suggest early professional evaluation may be important</li>
      </ol>

      <h3>Emergency Department: When Educational Resources Suggest Going Immediately</h3>
      <p>Educational resources suggest going to the emergency department right away if you experience:</p>
      <ul>
        <li>Sudden loss of bowel or bladder control</li>
        <li>Sudden severe weakness or inability to walk</li>
        <li>Numbness in the groin or saddle area</li>
        <li>High fever with back pain</li>
        <li>Severe pain after a fall or accident</li>
      </ul>

      <h3>Important Educational Note</h3>
      <p>This educational assessment is a learning tool and cannot replace professional healthcare evaluation. The presence of these symptoms doesn't necessarily indicate you have a serious condition, but educational resources suggest they may warrant proper healthcare professional assessment to rule out conditions that could benefit from immediate attention.</p>

      <div class="footer">
        <p><strong>Educational Disclaimer:</strong> This material is provided for educational and informational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified healthcare provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read in this educational material. When in doubt, seek immediate medical attention.</p>
        <p>© ${new Date().getFullYear()} PainOptix. All rights reserved.</p>
        <p>If you received this message in error, please contact support@painoptix.com</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}