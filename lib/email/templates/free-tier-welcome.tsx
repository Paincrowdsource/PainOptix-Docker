export function getFreeTierWelcomeTemplate(ctx: { assessmentResults: any; userTier?: string }) {
  const { assessmentResults, userTier } = ctx;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://painoptix.com';

  // Logo HTML matching checkin emails
  const logoHtml = `<img src="${appUrl}/branding/painoptix-logo.png" alt="PainOptix" width="190" style="display:block;height:auto;max-width:190px;margin:0 auto;">`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Your PainOptix Educational Assessment Results</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 24px; background: #F6F8FB; font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #1F2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; border-collapse: collapse;">
    <tr>
      <td style="padding: 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background: #FFFFFF; border-radius: 16px; box-shadow: 0 16px 40px rgba(33, 56, 82, 0.08); border: 1px solid #E2E8F5; overflow: hidden;">
          <tr>
            <td style="padding: 32px 32px 28px 32px;">
              <!-- Logo Section -->
              <div style="margin: 0 0 14px 0; text-align: center;">${logoHtml}</div>

              <!-- Main Heading -->
              <h1 style="margin: 0 0 26px 0; font-size: 28px; line-height: 1.28; color: #0B5394; text-align: center;">
                Your Educational Assessment Results
              </h1>

              <!-- Welcome Message -->
              <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.65; color: #1F2937;">
                Thank you for completing your PainOptix educational assessment. Based on your responses, we've prepared a personalized educational guide about ${assessmentResults?.diagnosis || 'your condition'}.
              </p>

              <!-- Assessment Summary Box -->
              <div style="margin: 20px 0; padding: 18px; border: 1px solid #0B539422; background: #EFF5FF; border-radius: 12px;">
                <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #0B5394;">Your Assessment Summary</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0; font-size: 15px; color: #4B5563;">Condition Pattern:</td>
                    <td style="padding: 4px 0; font-size: 15px; color: #1F2937; font-weight: 600;">
                      ${assessmentResults?.diagnosis || 'Back Discomfort'}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-size: 15px; color: #4B5563;">Severity Level:</td>
                    <td style="padding: 4px 0; font-size: 15px; color: #1F2937; font-weight: 600;">
                      ${assessmentResults?.severity || 'Moderate'}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-size: 15px; color: #4B5563;">Duration:</td>
                    <td style="padding: 4px 0; font-size: 15px; color: #1F2937; font-weight: 600;">
                      ${assessmentResults?.duration || 'Not specified'}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Guide Information -->
              <div style="margin: 24px 0;">
                <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #1F2937;">Your Free Educational Guide Contains:</h2>
                <ul style="margin: 12px 0; padding-left: 20px; color: #4B5563; font-size: 15px; line-height: 1.8;">
                  <li>Basic explanation of ${assessmentResults?.diagnosis || 'your condition pattern'}</li>
                  <li>Common symptoms and characteristics</li>
                  <li>When to seek medical help (red flags)</li>
                  <li>General educational information</li>
                  <li>Encouragement to track progress on PainCrowdsource.org</li>
                </ul>
                <p style="margin: 12px 0 0 0; font-size: 14px; color: #6B7280; font-style: italic;">
                  Free guide length: Approximately 1-2 pages of educational content
                </p>
              </div>

              <!-- Guide Access CTA -->
              <div style="margin: 24px 0; padding: 20px; background: linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%); border: 2px solid #0B5394; border-radius: 12px;">
                <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #0B5394; text-align: center;">
                  📘 Your Educational Guide is Ready!
                </h3>
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #1F2937; text-align: center;">
                  Click below to view and download your personalized PDF guide:
                </p>
                <div style="text-align: center;">
                  <a href="${appUrl}/guide/${assessmentResults?.assessmentId || 'YOUR_ASSESSMENT_ID'}"
                     style="display: inline-block; padding: 14px 32px; background: #0B5394; color: #FFFFFF; text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 16px; letter-spacing: 0.02em; box-shadow: 0 4px 14px 0 rgba(11, 83, 148, 0.25);">
                    View & Download My Guide
                  </a>
                </div>
                <p style="margin: 12px 0 0 0; font-size: 13px; color: #6B7280; text-align: center;">
                  You can access this guide anytime from your email or browser bookmarks
                </p>
              </div>

              <!-- Upgrade Options - ACCURATE DESCRIPTIONS -->
              ${userTier === 'free' ? `
              <div style="margin: 28px 0; padding: 20px; background: #F7FAFF; border-radius: 14px; border: 1px solid #0B539433;">
                <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #0B5394;">Want More Detailed Information?</h3>

                <div style="margin: 16px 0; padding: 16px; background: white; border-radius: 8px; border: 1px solid #E5E7EB;">
                  <p style="margin: 0 0 8px 0; font-size: 16px; color: #1F2937; font-weight: 600;">
                    📄 Enhanced Clinical Guide ($5)
                  </p>
                  <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #4B5563; font-size: 14px; line-height: 1.6;">
                    <li>Everything in the free guide, plus:</li>
                    <li>How doctors evaluate your condition</li>
                    <li>Strategies to discuss with your doctor</li>
                    <li>What to expect during medical evaluation</li>
                    <li>Research bibliography with 10 medical citations</li>
                    <li>4-5 pages of clinical information</li>
                  </ul>
                </div>

                <div style="margin: 16px 0; padding: 16px; background: white; border-radius: 8px; border: 1px solid #E5E7EB;">
                  <p style="margin: 0 0 8px 0; font-size: 16px; color: #1F2937; font-weight: 600;">
                    📚 Comprehensive Medical Monograph ($20)
                  </p>
                  <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #4B5563; font-size: 14px; line-height: 1.6;">
                    <li>Everything in Enhanced, plus:</li>
                    <li>14+ detailed sections on your condition</li>
                    <li>Anatomical explanations of pain mechanisms</li>
                    <li>Exercise program with visual illustrations</li>
                    <li>14-day symptom tracking guide</li>
                    <li>Extensive medical bibliography</li>
                    <li>15+ pages comprehensive medical education</li>
                  </ul>
                  <p style="margin: 8px 0 0 0; font-size: 13px; color: #6B7280; font-style: italic;">
                    Includes therapeutic exercise illustrations for proper form
                  </p>
                </div>

                <div style="text-align: center; margin-top: 20px;">
                  <a href="${appUrl}/guide/${assessmentResults?.assessmentId}/upgrade"
                     style="display: inline-block; padding: 12px 28px; background: #0B5394; color: #FFFFFF; text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 15px; letter-spacing: 0.02em;">
                    View Upgrade Options
                  </a>
                </div>
              </div>
              ` : ''}

              <!-- Follow-up Notice -->
              <div style="margin: 24px 0; padding: 16px; background: #FEF3C7; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #78350F;">
                  <strong>📅 We'll check in with you</strong><br>
                  We'll send you follow-up emails over the next 14 days to see how you're doing and provide additional educational resources.
                </p>
              </div>

              <!-- Footer with Disclaimer -->
              <div style="margin-top: 28px; border-top: 1px solid #E2E8F5; padding-top: 16px;">
                <p style="margin: 0 0 12px 0; font-size: 12px; line-height: 1.6; color: #6B7280;">
                  <strong>Educational Disclaimer:</strong> This material is provided for educational and informational purposes only.
                  It is not intended to be a substitute for professional medical advice, diagnosis, or treatment.
                  Always seek the advice of your physician or other qualified healthcare provider with any questions you may have regarding a medical condition.
                </p>

                <div style="text-align: center; margin-top: 16px;">
                  <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                    © ${new Date().getFullYear()} PainOptix. All rights reserved.
                  </p>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: #9CA3AF;">
                    Designed by Bradley W. Carpentier, MD
                  </p>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: #9CA3AF;">
                    <a href="${appUrl}/unsubscribe" style="color: #0B5394; text-decoration: underline;">Unsubscribe</a> |
                    <a href="${appUrl}/privacy" style="color: #0B5394; text-decoration: underline;">Privacy Policy</a>
                  </p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}