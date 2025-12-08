import { getServiceSupabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/comm/email';
import { logEvent } from '@/lib/logging';
import {
  BRAND_BLUE,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  TEXT_LIGHT,
  BG_BODY,
  BG_CARD,
  BG_TIP,
  BG_SUBTLE,
  BRAND_BLUE_BORDER,
  BRAND_BLUE_BORDER_SOLID,
  BORDER_SUBTLE,
  SUCCESS_BG,
  SUCCESS_ACCENT,
  WARNING_BG,
  WARNING_TEXT,
  WARNING_TEXT_DARK,
  BUTTON_SHADOW,
  CARD_SHADOW,
  getLogoHtml,
} from './brand';

/**
 * Day 4 follow-up for Enhanced ($5) purchasers
 * Check-in with subtle mention of Monograph option
 */
export async function sendEnhancedFollowUp(assessmentId: string) {
  const supabase = getServiceSupabase();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://painoptix.com';
  const logoHtml = getLogoHtml(appUrl);

  // Get assessment data
  const { data: assessment } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', assessmentId)
    .single();

  if (!assessment) {
    await logEvent('followup_skip_no_assessment', { assessmentId });
    return;
  }

  // Check for red flags or marketing opt-out
  if (assessment.has_red_flags || assessment.marketing_opted_out) {
    await logEvent('followup_suppressed', {
      assessmentId,
      reason: assessment.has_red_flags ? 'red_flags' : 'opted_out'
    });
    return;
  }

  // Idempotency check with deterministic key
  const dedupeKey = `enhanced_d4:${assessmentId}`;
  try {
    await supabase.rpc('claim_email_send', { dedupe_key: dedupeKey });
  } catch (err: any) {
    if (err.message?.includes('duplicate')) {
      await logEvent('followup_duplicate_prevented', { assessmentId, type: 'enhanced_d4' });
      return;
    }
    throw err;
  }

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Quick Check-In: How Are You Doing?</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 24px; background: ${BG_BODY}; font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: ${TEXT_PRIMARY};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; border-collapse: collapse;">
    <tr>
      <td style="padding: 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background: ${BG_CARD}; border-radius: 16px; box-shadow: ${CARD_SHADOW}; border: 1px solid ${BORDER_SUBTLE}; overflow: hidden;">
          <tr>
            <td style="padding: 32px 32px 28px 32px;">
              <!-- Logo -->
              <div style="margin: 0 0 14px 0; text-align: center;">${logoHtml}</div>

              <!-- Main Heading -->
              <h1 style="margin: 0 0 26px 0; font-size: 28px; line-height: 1.28; color: ${BRAND_BLUE}; text-align: center;">
                How's Your Progress?
              </h1>

              <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.65; color: ${TEXT_PRIMARY};">
                Hi there,
              </p>

              <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                It's been a few days since you received your Enhanced Report. We wanted to check in and see how you're doing with the information.
              </p>

              <!-- Tip Box -->
              <div style="margin: 20px 0; padding: 18px; border: 1px solid ${BRAND_BLUE_BORDER}; background: ${BG_TIP}; border-radius: 12px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: ${BRAND_BLUE};">Quick Implementation Tip</h3>
                <p style="margin: 0; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                  Many users find it helpful to start with just one recommendation from the report and implement it consistently for a week before adding others. This approach tends to lead to more sustainable improvements.
                </p>
              </div>

              <h3 style="margin: 24px 0 12px 0; font-size: 18px; color: ${TEXT_PRIMARY};">Questions About Your Report?</h3>
              <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                Your Enhanced Report contains comprehensive information, but we understand you might have questions about specific sections or recommendations. Feel free to share relevant sections with your healthcare provider during your next consultation.
              </p>

              <h3 style="margin: 24px 0 12px 0; font-size: 18px; color: ${TEXT_PRIMARY};">Going Deeper</h3>
              <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                Some users find additional value in our Complete Monograph, which includes:
              </p>
              <ul style="margin: 12px 0 20px 0; padding-left: 20px; color: ${TEXT_SECONDARY}; font-size: 15px; line-height: 1.8;">
                <li>Medical illustrations to better visualize anatomical relationships</li>
                <li>Case studies showing real-world treatment outcomes</li>
                <li>Recovery timeline modeling based on clinical data</li>
                <li>Provider communication templates for more effective consultations</li>
              </ul>

              <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                The Monograph is designed for those who want the most comprehensive educational resource available for their condition.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 24px 0;">
                <a href="${appUrl}/upgrade?assessment=${assessment.id}&to=monograph"
                   style="display: inline-block; padding: 14px 32px; background: ${BRAND_BLUE}; color: #FFFFFF; text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 16px; letter-spacing: 0.02em; box-shadow: ${BUTTON_SHADOW};">
                  Learn More About the Monograph
                </a>
              </div>

              <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                Whether you stick with your Enhanced Report or explore additional resources, we're here to support your educational journey.
              </p>

              <p style="margin: 0 0 0; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                Best wishes for your continued progress,<br>
                <strong style="color: ${TEXT_PRIMARY};">The PainOptix Team</strong>
              </p>

              <!-- Footer -->
              <div style="margin-top: 28px; border-top: 1px solid ${BORDER_SUBTLE}; padding-top: 16px;">
                <p style="margin: 0 0 12px 0; font-size: 12px; line-height: 1.6; color: ${TEXT_MUTED};">
                  <strong>Medical Disclaimer:</strong> This educational material does not replace professional medical advice.
                </p>
                <div style="text-align: center; margin-top: 16px;">
                  <p style="margin: 0; font-size: 12px; color: ${TEXT_LIGHT};">
                    &copy; ${new Date().getFullYear()} PainOptix. All rights reserved.
                  </p>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: ${TEXT_LIGHT};">
                    <a href="${appUrl}/unsubscribe?id=${assessment.id}" style="color: ${BRAND_BLUE}; text-decoration: underline;">Unsubscribe</a>
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

  await sendEmail(
    assessment.email,
    'Quick Check-In: How Are You Doing?',
    html
  );

  await logEvent('followup_sent_enhanced_d4', { assessmentId });
}

/**
 * Day 7 follow-up for Monograph ($20) purchasers
 * Implementation support with optional coaching mention
 */
export async function sendMonographFollowUp(assessmentId: string) {
  const supabase = getServiceSupabase();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://painoptix.com';
  const logoHtml = getLogoHtml(appUrl);

  // Get assessment data
  const { data: assessment } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', assessmentId)
    .single();

  if (!assessment) {
    await logEvent('followup_skip_no_assessment', { assessmentId });
    return;
  }

  // Check for red flags or marketing opt-out
  if (assessment.has_red_flags || assessment.marketing_opted_out) {
    await logEvent('followup_suppressed', {
      assessmentId,
      reason: assessment.has_red_flags ? 'red_flags' : 'opted_out'
    });
    return;
  }

  // Idempotency check with deterministic key
  const dedupeKey = `mono_d7:${assessmentId}`;
  try {
    await supabase.rpc('claim_email_send', { dedupe_key: dedupeKey });
  } catch (err: any) {
    if (err.message?.includes('duplicate')) {
      await logEvent('followup_duplicate_prevented', { assessmentId, type: 'mono_d7' });
      return;
    }
    throw err;
  }

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Week 1 Check-In: Your Monograph Journey</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 24px; background: ${BG_BODY}; font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: ${TEXT_PRIMARY};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; border-collapse: collapse;">
    <tr>
      <td style="padding: 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background: ${BG_CARD}; border-radius: 16px; box-shadow: ${CARD_SHADOW}; border: 1px solid ${BORDER_SUBTLE}; overflow: hidden;">
          <tr>
            <td style="padding: 32px 32px 28px 32px;">
              <!-- Logo -->
              <div style="margin: 0 0 14px 0; text-align: center;">${logoHtml}</div>

              <!-- Main Heading -->
              <h1 style="margin: 0 0 26px 0; font-size: 28px; line-height: 1.28; color: ${BRAND_BLUE}; text-align: center;">
                Making the Most of Your Monograph
              </h1>

              <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.65; color: ${TEXT_PRIMARY};">
                Hi there,
              </p>

              <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                It's been a week since you received your Complete Pain Management Monograph. We hope you've had a chance to review the comprehensive materials and start implementing some of the recommendations.
              </p>

              <!-- Success Tip Box -->
              <div style="margin: 20px 0; padding: 16px; background: ${SUCCESS_BG}; border-left: 4px solid ${SUCCESS_ACCENT}; border-radius: 0 8px 8px 0;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: ${TEXT_PRIMARY};">Implementation Success Tip</h3>
                <p style="margin: 0; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                  Research shows that people who track their progress are 2x more likely to achieve their health goals. Consider using the Recovery Timeline section of your monograph to benchmark your progress over the coming weeks.
                </p>
              </div>

              <h3 style="margin: 24px 0 12px 0; font-size: 18px; color: ${TEXT_PRIMARY};">Common Questions at This Stage</h3>
              <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                Many monograph users find these sections particularly helpful after the first week:
              </p>
              <ul style="margin: 12px 0 20px 0; padding-left: 20px; color: ${TEXT_SECONDARY}; font-size: 15px; line-height: 1.8;">
                <li><strong style="color: ${TEXT_PRIMARY};">Provider Discussion Guide (Section 4):</strong> Prepare for your next appointment</li>
                <li><strong style="color: ${TEXT_PRIMARY};">Lifestyle Integration (Section 7):</strong> Practical daily modifications</li>
                <li><strong style="color: ${TEXT_PRIMARY};">Case Studies (Section 5):</strong> See how others navigated similar challenges</li>
              </ul>

              <!-- Resource Box -->
              <div style="margin: 20px 0; padding: 18px; border: 1px solid ${BRAND_BLUE_BORDER_SOLID}; background: ${BG_SUBTLE}; border-radius: 12px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: ${BRAND_BLUE};">Additional Support Available</h3>
                <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                  As a monograph owner, you've invested in comprehensive education about your condition. Some users find value in personalized coaching support to help implement the recommendations effectively.
                </p>
                <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                  Our optional coaching program includes:
                </p>
                <ul style="margin: 8px 0 12px 0; padding-left: 20px; color: ${TEXT_SECONDARY}; font-size: 14px; line-height: 1.7;">
                  <li>Weekly check-ins to track progress</li>
                  <li>Personalized implementation strategies</li>
                  <li>Direct answers to your specific questions</li>
                  <li>Accountability and motivation support</li>
                </ul>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${TEXT_MUTED}; font-style: italic;">
                  This is completely optional and only for those who want additional personalized guidance.
                </p>
              </div>

              <h3 style="margin: 24px 0 12px 0; font-size: 18px; color: ${TEXT_PRIMARY};">Your Progress Matters</h3>
              <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                Remember, improvement often comes in waves rather than a straight line. The comprehensive information in your monograph is designed to support you through the entire journey, not just the first few days.
              </p>

              <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                Keep referring back to different sections as your needs evolve. The monograph is your permanent resource.
              </p>

              <p style="margin: 0 0 0; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                Wishing you continued progress,<br>
                <strong style="color: ${TEXT_PRIMARY};">The PainOptix Team</strong>
              </p>

              <!-- Footer -->
              <div style="margin-top: 28px; border-top: 1px solid ${BORDER_SUBTLE}; padding-top: 16px;">
                <p style="margin: 0 0 12px 0; font-size: 12px; line-height: 1.6; color: ${TEXT_MUTED};">
                  <strong>Medical Disclaimer:</strong> Educational materials and coaching support do not replace professional medical care.
                </p>
                <div style="text-align: center; margin-top: 16px;">
                  <p style="margin: 0; font-size: 12px; color: ${TEXT_LIGHT};">
                    &copy; ${new Date().getFullYear()} PainOptix. All rights reserved.
                  </p>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: ${TEXT_LIGHT};">
                    <a href="${appUrl}/preferences?id=${assessment.id}" style="color: ${BRAND_BLUE}; text-decoration: underline;">Manage Preferences</a>
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

  await sendEmail(
    assessment.email,
    'Week 1 Check-In: Your Monograph Journey',
    html
  );

  await logEvent('followup_sent_mono_d7', { assessmentId });
}

/**
 * Day 3 follow-up for free tier users
 * Educational tip, only if prior engagement detected
 */
export async function sendFreeFollowUp(assessmentId: string) {
  const supabase = getServiceSupabase();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://painoptix.com';
  const logoHtml = getLogoHtml(appUrl);

  // Get assessment data
  const { data: assessment } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', assessmentId)
    .single();

  if (!assessment) {
    await logEvent('followup_skip_no_assessment', { assessmentId });
    return;
  }

  // Check for red flags or marketing opt-out
  if (assessment.has_red_flags || assessment.marketing_opted_out) {
    await logEvent('followup_suppressed', {
      assessmentId,
      reason: assessment.has_red_flags ? 'red_flags' : 'opted_out'
    });
    return;
  }

  // Check for engagement (guide opened)
  if (!assessment.guide_opened_at) {
    await logEvent('followup_skip_no_engagement', { assessmentId });
    return;
  }

  // Idempotency check with deterministic key
  const dedupeKey = `free_d3:${assessmentId}`;
  try {
    await supabase.rpc('claim_email_send', { dedupe_key: dedupeKey });
  } catch (err: any) {
    if (err.message?.includes('duplicate')) {
      await logEvent('followup_duplicate_prevented', { assessmentId, type: 'free_d3' });
      return;
    }
    throw err;
  }

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Your Weekly Back Pain Education Tip</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 24px; background: ${BG_BODY}; font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: ${TEXT_PRIMARY};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; border-collapse: collapse;">
    <tr>
      <td style="padding: 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background: ${BG_CARD}; border-radius: 16px; box-shadow: ${CARD_SHADOW}; border: 1px solid ${BORDER_SUBTLE}; overflow: hidden;">
          <tr>
            <td style="padding: 32px 32px 28px 32px;">
              <!-- Logo -->
              <div style="margin: 0 0 14px 0; text-align: center;">${logoHtml}</div>

              <!-- Main Heading -->
              <h1 style="margin: 0 0 26px 0; font-size: 28px; line-height: 1.28; color: ${BRAND_BLUE}; text-align: center;">
                Your Educational Tip of the Week
              </h1>

              <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.65; color: ${TEXT_PRIMARY};">
                Hi there,
              </p>

              <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                Thank you for reviewing your free educational guide. We hope you found the information helpful in understanding your condition better.
              </p>

              <!-- Main Tip Card -->
              <div style="margin: 20px 0; padding: 20px; border: 2px solid ${BRAND_BLUE}; background: ${BG_TIP}; border-radius: 12px;">
                <h2 style="margin: 0 0 12px 0; font-size: 18px; color: ${BRAND_BLUE};">This Week's Educational Insight</h2>
                <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.65; color: ${TEXT_PRIMARY};">
                  <strong>The 10-Minute Rule for Back Pain:</strong>
                </p>
                <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                  Research shows that changing positions every 30-60 minutes can significantly reduce pain intensity. If you're sitting, stand and walk for 2-3 minutes. If you're standing, sit and stretch. This simple practice can prevent muscle fatigue and reduce pain buildup throughout the day.
                </p>
                <p style="margin: 0; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                  Try setting a gentle reminder on your phone to prompt position changes. Many users report this single change makes a noticeable difference within the first week.
                </p>
              </div>

              <!-- Did You Know Box -->
              <div style="margin: 20px 0; padding: 16px; background: ${WARNING_BG}; border-left: 4px solid ${WARNING_TEXT_DARK}; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; font-size: 15px; line-height: 1.65; color: ${WARNING_TEXT};">
                  <strong>Did You Know?</strong><br>
                  Movement is often more effective than rest for most types of back pain. Gentle, regular movement helps maintain flexibility and prevents muscles from becoming stiff and painful.
                </p>
              </div>

              <h3 style="margin: 24px 0 12px 0; font-size: 18px; color: ${TEXT_PRIMARY};">Want More Insights Like This?</h3>
              <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                Your free guide covered the essentials, but there's so much more to learn about managing your condition effectively. Our paid reports include:
              </p>

              <div style="margin: 16px 0; padding: 16px; background: ${BG_CARD}; border: 1px solid ${BORDER_SUBTLE}; border-radius: 8px;">
                <p style="margin: 0 0 8px 0; font-size: 15px; color: ${TEXT_PRIMARY}; font-weight: 600;">
                  Enhanced Report ($5):
                </p>
                <ul style="margin: 8px 0 0 0; padding-left: 20px; color: ${TEXT_SECONDARY}; font-size: 14px; line-height: 1.7;">
                  <li>Detailed explanations of why certain treatments work</li>
                  <li>Scientific research summaries in plain language</li>
                  <li>Comprehensive treatment comparisons</li>
                </ul>
              </div>

              <div style="margin: 16px 0; padding: 16px; background: ${BG_CARD}; border: 1px solid ${BORDER_SUBTLE}; border-radius: 8px;">
                <p style="margin: 0 0 8px 0; font-size: 15px; color: ${TEXT_PRIMARY}; font-weight: 600;">
                  Complete Monograph ($20):
                </p>
                <ul style="margin: 8px 0 0 0; padding-left: 20px; color: ${TEXT_SECONDARY}; font-size: 14px; line-height: 1.7;">
                  <li>Everything in the Enhanced Report, plus...</li>
                  <li>Visual guides and medical illustrations</li>
                  <li>Recovery roadmaps and timelines</li>
                  <li>Professional resources for working with your healthcare team</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 24px 0;">
                <a href="${appUrl}/upgrade?assessment=${assessment.id}"
                   style="display: inline-block; padding: 14px 32px; background: ${BRAND_BLUE}; color: #FFFFFF; text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 16px; letter-spacing: 0.02em; box-shadow: ${BUTTON_SHADOW};">
                  Explore Your Options
                </a>
              </div>

              <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                Whether you choose to upgrade or stick with your free guide, we're glad you're taking steps to understand your condition better.
              </p>

              <p style="margin: 0 0 0; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                Stay well,<br>
                <strong style="color: ${TEXT_PRIMARY};">The PainOptix Team</strong>
              </p>

              <!-- Footer -->
              <div style="margin-top: 28px; border-top: 1px solid ${BORDER_SUBTLE}; padding-top: 16px;">
                <p style="margin: 0 0 12px 0; font-size: 12px; line-height: 1.6; color: ${TEXT_MUTED};">
                  <strong>Medical Disclaimer:</strong> Educational tips are not personalized medical advice. Always consult healthcare providers for treatment decisions.
                </p>
                <div style="text-align: center; margin-top: 16px;">
                  <p style="margin: 0; font-size: 12px; color: ${TEXT_LIGHT};">
                    &copy; ${new Date().getFullYear()} PainOptix. All rights reserved.
                  </p>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: ${TEXT_LIGHT};">
                    <a href="${appUrl}/unsubscribe?id=${assessment.id}" style="color: ${BRAND_BLUE}; text-decoration: underline;">Unsubscribe</a>
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

  await sendEmail(
    assessment.email,
    'Your Weekly Back Pain Education Tip',
    html
  );

  await logEvent('followup_sent_free_d3', { assessmentId });
}

/**
 * Day 14 follow-up for free tier users (V1.2 requirement)
 * Educational content, no urgency, soft mention of upgrades
 * Only sent if user has engaged with previous emails
 */
export async function sendFreeD14FollowUp(assessmentId: string) {
  const supabase = getServiceSupabase();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://painoptix.com';
  const logoHtml = getLogoHtml(appUrl);

  // Get assessment data
  const { data: assessment } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', assessmentId)
    .single();

  if (!assessment) {
    await logEvent('followup_skip_no_assessment', { assessmentId, type: 'free_d14' });
    return;
  }

  // Check for red flags or marketing opt-out
  if (assessment.has_red_flags || assessment.marketing_opted_out) {
    await logEvent('followup_suppressed', {
      assessmentId,
      type: 'free_d14',
      reason: assessment.has_red_flags ? 'red_flags' : 'opted_out'
    });
    return;
  }

  // Check for engagement - required for 14-day follow-up
  const { data: hasEngaged } = await supabase.rpc('has_email_engagement', {
    p_assessment_id: assessmentId
  });

  if (!hasEngaged) {
    await logEvent('followup_skip_no_engagement', { assessmentId, type: 'free_d14' });
    return;
  }

  // Idempotency check with deterministic key
  const dedupeKey = `free_d14:${assessmentId}`;
  try {
    await supabase.rpc('claim_email_send', { dedupe_key: dedupeKey });
  } catch (err: any) {
    if (err.message?.includes('duplicate')) {
      await logEvent('followup_duplicate_prevented', { assessmentId, type: 'free_d14' });
      return;
    }
    throw err;
  }

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Your Two-Week Educational Progress Check</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 24px; background: ${BG_BODY}; font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: ${TEXT_PRIMARY};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; border-collapse: collapse;">
    <tr>
      <td style="padding: 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background: ${BG_CARD}; border-radius: 16px; box-shadow: ${CARD_SHADOW}; border: 1px solid ${BORDER_SUBTLE}; overflow: hidden;">
          <tr>
            <td style="padding: 32px 32px 28px 32px;">
              <!-- Logo -->
              <div style="margin: 0 0 14px 0; text-align: center;">${logoHtml}</div>

              <!-- Main Heading -->
              <h1 style="margin: 0 0 26px 0; font-size: 28px; line-height: 1.28; color: ${BRAND_BLUE}; text-align: center;">
                Your Two-Week Progress Check
              </h1>

              <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.65; color: ${TEXT_PRIMARY};">
                Hi there,
              </p>

              <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                It's been two weeks since you started your educational journey with PainOptix. We hope you've found the information helpful in understanding your situation better.
              </p>

              <!-- Progress Box -->
              <div style="margin: 20px 0; padding: 18px; background: ${SUCCESS_BG}; border-left: 4px solid ${SUCCESS_ACCENT}; border-radius: 0 8px 8px 0;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: ${TEXT_PRIMARY};">Two-Week Milestone</h3>
                <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                  Research shows that people who actively engage with educational health materials for two weeks are more likely to:
                </p>
                <ul style="margin: 8px 0 0 0; padding-left: 20px; color: ${TEXT_SECONDARY}; font-size: 14px; line-height: 1.7;">
                  <li>Better understand their condition</li>
                  <li>Have more productive healthcare conversations</li>
                  <li>Make informed decisions about their care</li>
                </ul>
              </div>

              <h3 style="margin: 24px 0 12px 0; font-size: 18px; color: ${TEXT_PRIMARY};">Continuing Your Educational Journey</h3>
              <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                Here are some ways to build on what you've learned:
              </p>

              <!-- Checklist Box -->
              <div style="margin: 20px 0; padding: 18px; background: ${BG_CARD}; border: 2px solid ${BORDER_SUBTLE}; border-radius: 12px;">
                <h4 style="margin: 0 0 12px 0; font-size: 16px; color: ${BRAND_BLUE};">Progress Checklist</h4>
                <ul style="margin: 0; padding-left: 0; list-style: none; color: ${TEXT_SECONDARY}; font-size: 15px; line-height: 2;">
                  <li style="padding-left: 24px; position: relative;"><span style="position: absolute; left: 0;">&#9744;</span> Review your initial educational guide</li>
                  <li style="padding-left: 24px; position: relative;"><span style="position: absolute; left: 0;">&#9744;</span> Note any changes in your situation</li>
                  <li style="padding-left: 24px; position: relative;"><span style="position: absolute; left: 0;">&#9744;</span> Prepare questions for your next healthcare visit</li>
                  <li style="padding-left: 24px; position: relative;"><span style="position: absolute; left: 0;">&#9744;</span> Consider which strategies have been most helpful</li>
                  <li style="padding-left: 24px; position: relative;"><span style="position: absolute; left: 0;">&#9744;</span> Think about areas where you'd like more information</li>
                </ul>
              </div>

              <!-- Resource Card -->
              <div style="margin: 20px 0; padding: 18px; background: ${BG_SUBTLE}; border: 1px solid ${BRAND_BLUE_BORDER_SOLID}; border-radius: 12px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: ${BRAND_BLUE};">Additional Educational Resources</h3>
                <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                  Based on your engagement with our materials, you might find value in our expanded educational resources:
                </p>
                <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                  <strong style="color: ${TEXT_PRIMARY};">Enhanced Educational Guide ($5):</strong> Provides deeper insights into the science behind various management approaches, with extensive references to current research.
                </p>
                <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: ${TEXT_MUTED}; font-style: italic;">
                  This is completely optional - many users find the free guide sufficient for their needs. We mention it only for those seeking more comprehensive educational material.
                </p>
                <div style="text-align: center;">
                  <a href="${appUrl}/resources?assessment=${assessment.id}"
                     style="display: inline-block; padding: 12px 28px; background: ${BRAND_BLUE}; color: #FFFFFF; text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 15px; letter-spacing: 0.02em; box-shadow: ${BUTTON_SHADOW};">
                    Explore Educational Resources
                  </a>
                </div>
              </div>

              <h3 style="margin: 24px 0 12px 0; font-size: 18px; color: ${TEXT_PRIMARY};">Remember: You're Not Alone</h3>
              <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                Understanding your health situation is a journey, not a destination. Whether you continue with our free resources or explore additional materials, we're here to support your educational needs.
              </p>

              <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                Thank you for trusting PainOptix as part of your health education journey.
              </p>

              <p style="margin: 0 0 0; font-size: 15px; line-height: 1.65; color: ${TEXT_SECONDARY};">
                Best wishes for your continued learning,<br>
                <strong style="color: ${TEXT_PRIMARY};">The PainOptix Education Team</strong>
              </p>

              <!-- Footer -->
              <div style="margin-top: 28px; border-top: 1px solid ${BORDER_SUBTLE}; padding-top: 16px;">
                <p style="margin: 0 0 12px 0; font-size: 12px; line-height: 1.6; color: ${TEXT_MUTED};">
                  <strong>Educational Disclaimer:</strong> This material is for educational purposes only and does not constitute medical advice. Always consult qualified healthcare providers for medical decisions.
                </p>
                <div style="text-align: center; margin-top: 16px;">
                  <p style="margin: 0; font-size: 12px; color: ${TEXT_LIGHT};">
                    &copy; ${new Date().getFullYear()} PainOptix. All rights reserved.
                  </p>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: ${TEXT_MUTED};">
                    This is the final scheduled email in your free educational series.
                  </p>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: ${TEXT_LIGHT};">
                    <a href="${appUrl}/preferences?id=${assessment.id}" style="color: ${BRAND_BLUE}; text-decoration: underline;">Manage Preferences</a>
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

  await sendEmail(
    assessment.email,
    'Your Two-Week Educational Progress Check',
    html
  );

  await logEvent('followup_sent_free_d14', { assessmentId });
}
