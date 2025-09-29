export function getMonographConfirmationTemplate(ctx: { assessmentResults: any; userTier?: string }) {
  const { assessmentResults, userTier } = ctx;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://painoptix.com';

  // Logo HTML matching checkin emails
  const logoHtml = `<img src="${appUrl}/branding/painoptix-logo.png" alt="PainOptix" width="190" style="display:block;height:auto;max-width:190px;margin:0 auto;">`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Your Comprehensive Medical Monograph is Ready</title>
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
                Your Comprehensive Medical Monograph is Ready
              </h1>

              <!-- Success Message -->
              <div style="margin: 20px 0; padding: 16px; background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 8px;">
                <p style="margin: 0; font-size: 15px; color: #14532D;">
                  <strong>✓ Premium Purchase Confirmed</strong><br>
                  Thank you for your purchase. Your Comprehensive Medical Monograph for ${assessmentResults?.diagnosis || 'your condition'} is ready to download.
                </p>
              </div>

              <!-- What's Included -->
              <div style="margin: 24px 0;">
                <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #1F2937;">What's Included in Your Comprehensive Monograph</h2>

                <div style="padding: 16px; background: linear-gradient(135deg, #F3E8FF 0%, #EDE9FE 100%); border-radius: 8px; border: 1px solid #8B5CF6;">
                  <ul style="margin: 0; padding-left: 20px; color: #4B5563; font-size: 15px; line-height: 1.8;">
                    <li><strong>14+ Detailed Sections:</strong> Complete medical education about ${assessmentResults?.diagnosis || 'your condition'}</li>
                    <li><strong>Exercise Illustrations:</strong> Visual guides showing proper form for therapeutic movements</li>
                    <li><strong>Anatomical Explanations:</strong> Detailed understanding of pain mechanisms and structures</li>
                    <li><strong>Movement Strategies:</strong> Week-by-week exercise progressions with illustrated poses</li>
                    <li><strong>Clinical Insights:</strong> How doctors evaluate, diagnose, and treat this condition</li>
                    <li><strong>14-Day Tracker:</strong> Symptom monitoring guide to track your progress</li>
                    <li><strong>Extensive Bibliography:</strong> Comprehensive medical references and research</li>
                    <li><strong>Safety Guidelines:</strong> When to seek immediate medical attention</li>
                  </ul>
                  <p style="margin: 12px 0 0 0; font-size: 14px; color: #6B7280; font-style: italic;">
                    Length: 15+ pages with exercise illustrations • File size: 5-9MB
                  </p>
                </div>
              </div>

              <!-- Guide Access CTA -->
              <div style="margin: 24px 0; padding: 20px; background: linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%); border: 2px solid #0B5394; border-radius: 12px;">
                <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #0B5394; text-align: center;">
                  📚 Access Your Comprehensive Monograph
                </h3>
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #1F2937; text-align: center;">
                  Click below to view and download your illustrated medical monograph:
                </p>
                <div style="text-align: center;">
                  <a href="${appUrl}/guide/${assessmentResults?.assessmentId || 'YOUR_ASSESSMENT_ID'}"
                     style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%); color: #FFFFFF; text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 16px; letter-spacing: 0.02em; box-shadow: 0 4px 14px 0 rgba(124, 58, 237, 0.35);">
                    Download My Comprehensive Monograph
                  </a>
                </div>
                <p style="margin: 12px 0 0 0; font-size: 13px; color: #6B7280; text-align: center;">
                  Premium content with exercise illustrations • Access anytime
                </p>
              </div>

              <!-- How to Use Your Monograph -->
              <div style="margin: 24px 0;">
                <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #1F2937;">How to Use Your Comprehensive Monograph</h3>
                <ol style="margin: 8px 0; padding-left: 20px; color: #4B5563; font-size: 14px; line-height: 1.8;">
                  <li><strong>Start with Section 1:</strong> Understanding your symptoms and next steps</li>
                  <li><strong>Review Exercise Illustrations:</strong> Study the visual guides in Section 7 for proper form</li>
                  <li><strong>Track Your Progress:</strong> Use the 14-day tracker in Section 14 to monitor improvement</li>
                  <li><strong>Share with Your Doctor:</strong> Bring relevant sections to medical appointments</li>
                  <li><strong>Follow the Movement Plan:</strong> Progress through exercises as illustrated</li>
                </ol>
              </div>

              <!-- Premium Features Highlight -->
              <div style="margin: 24px 0; padding: 16px; background: #FEF3C7; border-radius: 8px;">
                <p style="margin: 0 0 8px 0; font-size: 15px; color: #78350F;">
                  <strong>🏆 Premium Features in Your Monograph</strong>
                </p>
                <ul style="margin: 8px 0; padding-left: 20px; font-size: 14px; color: #92400E; line-height: 1.6;">
                  <li>Exercise illustrations showing proper form for key movements</li>
                  <li>Visual guides for therapeutic exercises</li>
                  <li>Week-by-week progressive exercise program</li>
                  <li>Physician-authored content by Dr. Bradley W. Carpentier, MD</li>
                </ul>
              </div>

              <!-- PainCrowdsource Integration -->
              <div style="margin: 24px 0; padding: 16px; background: #F3F4F6; border-radius: 8px;">
                <p style="margin: 0 0 8px 0; font-size: 15px; color: #374151;">
                  <strong>🤝 Join the PainCrowdsource Community</strong>
                </p>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #4B5563;">
                  Track your progress and learn from others with similar conditions. Your anonymized data helps improve treatments for everyone.
                </p>
                <a href="https://paincrowdsource.org"
                   style="display: inline-block; padding: 8px 16px; background: #2563EB; color: #FFFFFF; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px;">
                  Visit PainCrowdsource.org
                </a>
              </div>

              <!-- Follow-up Notice -->
              <div style="margin: 24px 0; padding: 16px; background: #EFF6FF; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #1E3A8A;">
                  <strong>📅 14-Day Follow-Up Program</strong><br>
                  We'll check in with you periodically over the next 14 days to see how you're progressing with your monograph's exercise program.
                </p>
              </div>

              <!-- Footer with Disclaimer -->
              <div style="margin-top: 28px; border-top: 1px solid #E2E8F5; padding-top: 16px;">
                <p style="margin: 0 0 12px 0; font-size: 12px; line-height: 1.6; color: #6B7280;">
                  <strong>Medical Disclaimer:</strong> This comprehensive monograph is provided for educational and informational purposes only.
                  It is not intended to be a substitute for professional medical advice, diagnosis, or treatment.
                  The exercise illustrations are for educational reference only. Always consult your physician before beginning any exercise program.
                </p>

                <div style="text-align: center; margin-top: 16px;">
                  <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                    © ${new Date().getFullYear()} PainOptix. All rights reserved.
                  </p>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: #9CA3AF;">
                    Authored by Bradley W. Carpentier, MD
                  </p>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: #9CA3AF;">
                    <a href="${appUrl}/preferences" style="color: #0B5394; text-decoration: underline;">Email Preferences</a> |
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