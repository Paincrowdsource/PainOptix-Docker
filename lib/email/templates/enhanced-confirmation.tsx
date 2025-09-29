export function getEnhancedConfirmationTemplate(ctx: { assessmentResults: any; userTier?: string }) {
  const { assessmentResults, userTier } = ctx;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://painoptix.com';

  // Logo HTML matching checkin emails
  const logoHtml = `<img src="${appUrl}/branding/painoptix-logo.png" alt="PainOptix" width="190" style="display:block;height:auto;max-width:190px;margin:0 auto;">`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Your Enhanced Educational Report is Ready</title>
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
                Your Enhanced Educational Report is Ready
              </h1>

              <!-- Success Message -->
              <div style="margin: 20px 0; padding: 16px; background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 8px;">
                <p style="margin: 0; font-size: 15px; color: #14532D;">
                  <strong>✓ Purchase Confirmed</strong><br>
                  Thank you for your purchase. Your Enhanced Educational Report for ${assessmentResults?.diagnosis || 'your condition'} is ready to download.
                </p>
              </div>

              <!-- What's Included -->
              <div style="margin: 24px 0;">
                <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #1F2937;">What's Included in Your Enhanced Report</h2>

                <div style="padding: 16px; background: #F7FAFF; border-radius: 8px; border: 1px solid #0B539433;">
                  <ul style="margin: 0; padding-left: 20px; color: #4B5563; font-size: 15px; line-height: 1.8;">
                    <li><strong>Clinical Overview:</strong> Detailed explanation of ${assessmentResults?.diagnosis || 'your condition'}</li>
                    <li><strong>Medical Evaluation:</strong> How doctors diagnose and evaluate this condition</li>
                    <li><strong>Management Strategies:</strong> Evidence-based approaches to discuss with your doctor</li>
                    <li><strong>What to Expect:</strong> Information about medical consultations and treatment options</li>
                    <li><strong>Research Bibliography:</strong> 10 peer-reviewed medical citations for further reading</li>
                    <li><strong>Professional Language:</strong> Medical terminology explained in accessible terms</li>
                  </ul>
                  <p style="margin: 12px 0 0 0; font-size: 14px; color: #6B7280; font-style: italic;">
                    Length: 4-5 pages of detailed clinical information
                  </p>
                </div>
              </div>

              <!-- Guide Access CTA -->
              <div style="margin: 24px 0; padding: 20px; background: linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%); border: 2px solid #0B5394; border-radius: 12px;">
                <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #0B5394; text-align: center;">
                  📘 Access Your Enhanced Report
                </h3>
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #1F2937; text-align: center;">
                  Click below to view and download your PDF report:
                </p>
                <div style="text-align: center;">
                  <a href="${appUrl}/guide/${assessmentResults?.assessmentId || 'YOUR_ASSESSMENT_ID'}"
                     style="display: inline-block; padding: 14px 32px; background: #0B5394; color: #FFFFFF; text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 16px; letter-spacing: 0.02em; box-shadow: 0 4px 14px 0 rgba(11, 83, 148, 0.25);">
                    Download My Enhanced Report
                  </a>
                </div>
                <p style="margin: 12px 0 0 0; font-size: 13px; color: #6B7280; text-align: center;">
                  You can access this report anytime from your email or browser bookmarks
                </p>
              </div>

              <!-- How to Use Your Report -->
              <div style="margin: 24px 0;">
                <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #1F2937;">How to Use Your Enhanced Report</h3>
                <ol style="margin: 8px 0; padding-left: 20px; color: #4B5563; font-size: 14px; line-height: 1.8;">
                  <li>Review the clinical overview to understand your condition pattern</li>
                  <li>Share relevant sections with your healthcare provider during consultations</li>
                  <li>Use the medical evaluation section to prepare questions for your doctor</li>
                  <li>Reference the bibliography for additional evidence-based information</li>
                </ol>
              </div>

              <!-- Upgrade Option -->
              ${userTier !== 'monograph' ? `
              <div style="margin: 24px 0; padding: 16px; background: #FEF3C7; border-radius: 8px;">
                <p style="margin: 0 0 8px 0; font-size: 15px; color: #78350F;">
                  <strong>📚 Want Even More Detail?</strong>
                </p>
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #92400E;">
                  Our Comprehensive Monograph ($20) adds:
                </p>
                <ul style="margin: 8px 0 12px 0; padding-left: 20px; font-size: 14px; color: #92400E;">
                  <li>Visual exercise illustrations for proper form</li>
                  <li>14+ detailed sections with anatomical explanations</li>
                  <li>Progressive movement program with illustrated guides</li>
                  <li>14-day symptom tracking system</li>
                  <li>15+ pages of comprehensive medical education</li>
                </ul>
                <a href="${appUrl}/upgrade?assessment=${assessmentResults?.assessmentId}"
                   style="display: inline-block; padding: 10px 20px; background: #F59E0B; color: #FFFFFF; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  Upgrade to Monograph
                </a>
              </div>
              ` : ''}

              <!-- Follow-up Notice -->
              <div style="margin: 24px 0; padding: 16px; background: #EFF6FF; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #1E3A8A;">
                  <strong>📅 We'll check in with you</strong><br>
                  We'll send follow-up emails over the next 14 days to see how you're doing and provide additional educational resources.
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