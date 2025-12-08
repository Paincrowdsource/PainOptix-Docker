/**
 * Email Brand Constants
 *
 * Shared design tokens for all PainOptix email templates.
 * These values match the website branding in app/LandingPageV1Client.tsx
 *
 * IMPORTANT: All emails should use these constants to maintain brand consistency.
 * Never hardcode colors in email templates - always import from here.
 */

// Primary Brand Colors
export const BRAND_BLUE = '#0B5394';
export const BRAND_BLUE_HOVER = '#084074';
export const BRAND_BLUE_LIGHT = '#EFF5FF';
export const BRAND_BLUE_BORDER = '#0B539422';
export const BRAND_BLUE_BORDER_SOLID = '#0B539433';

// Text Colors (Tailwind Gray Scale)
export const TEXT_PRIMARY = '#1F2937';     // gray-800
export const TEXT_SECONDARY = '#4B5563';   // gray-600
export const TEXT_MUTED = '#6B7280';       // gray-500
export const TEXT_LIGHT = '#9CA3AF';       // gray-400

// Background Colors
export const BG_BODY = '#F6F8FB';
export const BG_CARD = '#FFFFFF';
export const BG_SUBTLE = '#F7FAFF';
export const BG_TIP = '#EFF5FF';

// Border Colors
export const BORDER_SUBTLE = '#E2E8F5';
export const BORDER_CARD = '#E5E7EB';

// Status Colors
export const SUCCESS_BG = '#F0FDF4';
export const SUCCESS_BORDER = '#86EFAC';
export const SUCCESS_TEXT = '#14532D';
export const SUCCESS_ACCENT = '#48bb78';

export const WARNING_BG = '#FEF3C7';
export const WARNING_BORDER = '#F39C12';
export const WARNING_TEXT = '#78350F';
export const WARNING_TEXT_DARK = '#92400E';

// Button Shadows
export const BUTTON_SHADOW = '0 4px 14px 0 rgba(11, 83, 148, 0.25)';
export const CARD_SHADOW = '0 16px 40px rgba(33, 56, 82, 0.08)';

/**
 * Generate logo HTML for email templates
 * @param appUrl - The base app URL (e.g., https://painoptix.com)
 * @returns HTML string for the logo
 */
export function getLogoHtml(appUrl: string): string {
  return `<img src="${appUrl}/branding/painoptix-logo.png" alt="PainOptix" width="190" style="display:block;height:auto;max-width:190px;margin:0 auto;">`;
}

/**
 * Generate the standard email wrapper HTML (opening tags)
 * @param title - Email title for <title> tag
 * @returns HTML string for email opening structure
 */
export function getEmailWrapperOpen(title: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 24px; background: ${BG_BODY}; font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: ${TEXT_PRIMARY};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; border-collapse: collapse;">
    <tr>
      <td style="padding: 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background: ${BG_CARD}; border-radius: 16px; box-shadow: ${CARD_SHADOW}; border: 1px solid ${BORDER_SUBTLE}; overflow: hidden;">
          <tr>
            <td style="padding: 32px 32px 28px 32px;">`;
}

/**
 * Generate the standard email wrapper HTML (closing tags)
 * @returns HTML string for email closing structure
 */
export function getEmailWrapperClose(): string {
  return `            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate a primary CTA button
 * @param href - Button link URL
 * @param text - Button text
 * @returns HTML string for the button
 */
export function getPrimaryButton(href: string, text: string): string {
  return `<a href="${href}" style="display: inline-block; padding: 14px 32px; background: ${BRAND_BLUE}; color: #FFFFFF; text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 16px; letter-spacing: 0.02em; box-shadow: ${BUTTON_SHADOW};">${text}</a>`;
}

/**
 * Generate a secondary (outline) button
 * @param href - Button link URL
 * @param text - Button text
 * @returns HTML string for the button
 */
export function getSecondaryButton(href: string, text: string): string {
  return `<a href="${href}" style="display: inline-block; padding: 12px 28px; background: ${BG_CARD}; color: ${BRAND_BLUE}; text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 15px; letter-spacing: 0.02em; border: 2px solid ${BRAND_BLUE};">${text}</a>`;
}

/**
 * Generate standard email footer with disclaimer
 * @param appUrl - The base app URL
 * @param assessmentId - Optional assessment ID for unsubscribe link
 * @returns HTML string for the footer
 */
export function getEmailFooter(appUrl: string, assessmentId?: string): string {
  const unsubscribeUrl = assessmentId
    ? `${appUrl}/unsubscribe?id=${assessmentId}`
    : `${appUrl}/unsubscribe`;

  return `<div style="margin-top: 28px; border-top: 1px solid ${BORDER_SUBTLE}; padding-top: 16px;">
  <p style="margin: 0 0 12px 0; font-size: 12px; line-height: 1.6; color: ${TEXT_MUTED};">
    <strong>Educational Disclaimer:</strong> This material is provided for educational and informational purposes only.
    It is not intended to be a substitute for professional medical advice, diagnosis, or treatment.
    Always seek the advice of your physician or other qualified healthcare provider with any questions you may have regarding a medical condition.
  </p>
  <div style="text-align: center; margin-top: 16px;">
    <p style="margin: 0; font-size: 12px; color: ${TEXT_LIGHT};">
      &copy; ${new Date().getFullYear()} PainOptix. All rights reserved.
    </p>
    <p style="margin: 4px 0 0 0; font-size: 12px; color: ${TEXT_LIGHT};">
      Designed by Bradley W. Carpentier, MD
    </p>
    <p style="margin: 4px 0 0 0; font-size: 12px; color: ${TEXT_LIGHT};">
      <a href="${unsubscribeUrl}" style="color: ${BRAND_BLUE}; text-decoration: underline;">Unsubscribe</a> |
      <a href="${appUrl}/privacy" style="color: ${BRAND_BLUE}; text-decoration: underline;">Privacy Policy</a>
    </p>
  </div>
</div>`;
}

/**
 * Generate a tip/info box with brand styling
 * @param title - Box title
 * @param content - Box content (can include HTML)
 * @returns HTML string for the tip box
 */
export function getTipBox(title: string, content: string): string {
  return `<div style="margin: 20px 0; padding: 18px; border: 1px solid ${BRAND_BLUE_BORDER}; background: ${BG_TIP}; border-radius: 12px;">
  <h3 style="margin: 0 0 12px 0; font-size: 16px; color: ${BRAND_BLUE};">${title}</h3>
  <div style="font-size: 15px; color: ${TEXT_SECONDARY}; line-height: 1.65;">${content}</div>
</div>`;
}

/**
 * Generate a success/confirmation box
 * @param title - Box title
 * @param content - Box content
 * @returns HTML string for the success box
 */
export function getSuccessBox(title: string, content: string): string {
  return `<div style="margin: 20px 0; padding: 16px; background: ${SUCCESS_BG}; border: 1px solid ${SUCCESS_BORDER}; border-radius: 8px;">
  <p style="margin: 0; font-size: 15px; color: ${SUCCESS_TEXT};">
    <strong>${title}</strong><br>${content}
  </p>
</div>`;
}

/**
 * Generate a warning/notice box
 * @param content - Box content (can include HTML)
 * @returns HTML string for the warning box
 */
export function getWarningBox(content: string): string {
  return `<div style="margin: 20px 0; padding: 16px; background: ${WARNING_BG}; border-radius: 8px;">
  <p style="margin: 0; font-size: 14px; color: ${WARNING_TEXT};">${content}</p>
</div>`;
}
