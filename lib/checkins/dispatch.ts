import { log } from '@/lib/logger';
import { getServiceSupabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/mailer/sendEmail';
import { sign, type CheckInDay, type CheckInValue } from './token';
import { isWithinSendWindow, isBeforeStartDate } from './time-utils';
import { resolveDiagnosisCode } from './diagnosis';
import { resolveLogoFragment } from './branding';
import { createHash } from 'crypto';

interface DispatchOptions {
  dryRun?: boolean;
}

interface DispatchResult {
  queued: number;
  sent: number;
  skipped: number;
  failed: number;
  errors?: string[];
}

/**
 * Dispatch due check-in messages
 * Queries check_in_queue for due messages and sends them
 * @param limit Maximum number of messages to process
 * @param options Dispatch options (dryRun, etc.)
 * @returns Summary of dispatch results
 */
export async function dispatchDue(
  limit: number = 100,
  options: DispatchOptions = {}
): Promise<DispatchResult> {
  const supabase = getServiceSupabase();
  const result: DispatchResult = {
    queued: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  try {
    // Query due messages
    const { data: dueMessages, error: queryError } = await supabase
      .from('check_in_queue')
      .select('*')
      .eq('status', 'queued')
      .eq('channel', 'email') // For now, only handling email
      .lte('due_at', new Date().toISOString())
      .limit(limit);

    if (queryError) {
      log("dispatch_query_error", { err: queryError.message }, "error");
      result.errors?.push('Failed to query due messages');
      return result;
    }

    if (!dueMessages || dueMessages.length === 0) {
      log("dispatch_no_due_messages");
      return result;
    }

    result.queued = dueMessages.length;
    log("dispatch_start", { count: result.queued });

    // Process each message
    for (const message of dueMessages) {
      try {
        // Check send window first
        const timezone = process.env.CHECKINS_SEND_TZ || 'America/New_York';
        const sendWindow = process.env.CHECKINS_SEND_WINDOW || '';
        const startAt = process.env.CHECKINS_START_AT;

        // Check if before start date
        if (isBeforeStartDate(new Date(), startAt)) {
          log("dispatch_skip_before_start", { messageId: message.id, startAt });
          continue; // Leave as queued, don't mark as skipped
        }

        // Check send window
        if (sendWindow) {
          const windowCheck = isWithinSendWindow(new Date(), timezone, sendWindow);
          if (!windowCheck.allowed) {
            log("dispatch_skip_window", { messageId: message.id, reason: windowCheck.reason });
            continue; // Leave as queued, don't mark as skipped
          }
        }

        // Get assessment details
        const { data: assessment } = await supabase
          .from('assessments')
          .select('email, guide_type, created_at')
          .eq('id', message.assessment_id)
          .single();

        if (!assessment?.email) {
          log("dispatch_no_email", { assessmentId: message.assessment_id }, "warn");
          result.failed++;
          continue;
        }

        // Get template
        const { data: template } = await supabase
          .from('message_templates')
          .select('*')
          .eq('key', message.template_key)
          .single();

        if (!template) {
          log("dispatch_template_not_found", { templateKey: message.template_key }, "error");
          result.failed++;
          continue;
        }

        // Resolve diagnosis code from guide_type
        const diagnosisCode = resolveDiagnosisCode(assessment);

        if (!diagnosisCode) {
          log("dispatch_missing_diagnosis", {
            messageId: message.id,
            assessmentId: message.assessment_id,
            guideType: assessment.guide_type
          }, "warn");

          // Mark as failed with clear error
          await supabase
            .from('check_in_queue')
            .update({
              status: 'failed',
              last_error: `missing_diagnosis_mapping: guide_type=${assessment.guide_type}`
            })
            .eq('id', message.id);

          result.skipped++;
          continue;
        }

        // Extract branch from template_key (e.g., "day3.initial" -> "initial", "day3.same" -> "same")
        const templateKeyParts = message.template_key.split('.');
        const branch = templateKeyParts[1] || 'same'; // Default to 'same' if parsing fails

        // Get diagnosis insert (strict diagnosis-only, no generic fallback)
        // For legacy 'initial' templates, try 'same' as fallback within same diagnosis
        let { data: diagnosisInsert } = await supabase
          .from('diagnosis_inserts')
          .select('insert_text')
          .eq('diagnosis_code', diagnosisCode)
          .eq('day', message.day)
          .eq('branch', branch)
          .single();

        // If 'initial' branch not found, try 'same' as fallback (for legacy queued rows)
        if (!diagnosisInsert && branch === 'initial') {
          const { data: sameBranchInsert } = await supabase
            .from('diagnosis_inserts')
            .select('insert_text')
            .eq('diagnosis_code', diagnosisCode)
            .eq('day', message.day)
            .eq('branch', 'same')
            .single();
          diagnosisInsert = sameBranchInsert;
        }

        // Skip if no diagnosis-specific insert found
        if (!diagnosisInsert) {
          log("dispatch_missing_insert", {
            messageId: message.id,
            diagnosisCode,
            day: message.day,
            branch: branch === 'initial' ? 'same (fallback from initial)' : branch
          }, "warn");

          // Mark as failed with clear error
          const effectiveBranch = branch === 'initial' ? 'same' : branch;
          await supabase
            .from('check_in_queue')
            .update({
              status: 'failed',
              last_error: `missing_diagnosis_insert: ${diagnosisCode} day${message.day} ${effectiveBranch}`
            })
            .eq('id', message.id);

          result.skipped++;
          continue;
        }

        // Get random encouragement
        const { data: encouragements } = await supabase
          .from('encouragements')
          .select('text');

        const encouragement = encouragements && encouragements.length > 0
          ? encouragements[Math.floor(Math.random() * encouragements.length)].text
          : 'Keep going - you are making progress.';

        // Compose email HTML
        const html = composeEmailHtml({
          template,
          insert: diagnosisInsert?.insert_text || 'Continue with gentle movement today.',
          encouragement,
          assessmentId: message.assessment_id,
          day: message.day as CheckInDay
        });

        // Check if dry run or sandbox mode
        const isDryRun = options.dryRun || process.env.CHECKINS_SANDBOX === '1';

        if (isDryRun) {
          // Log the message details without sending
          const hashedEmail = createHash('sha256').update(assessment.email).digest('hex').substring(0, 8);
          console.info('[DRY RUN] Would send check-in:', {
            template: message.template_key,
            to: `***${hashedEmail}`,
            assessmentId: message.assessment_id.substring(0, 8),
            day: message.day,
            subject: template.subject
          });

          if (options.dryRun) {
            // Mark as skipped only if explicitly dry-running
            await supabase
              .from('check_in_queue')
              .update({
                status: 'skipped',
                last_error: 'Dry run mode'
              })
              .eq('id', message.id);
            result.skipped++;
          } else {
            // Leave as queued if just in sandbox mode
            result.skipped++;
          }
        } else {
          // Actually send the email
          try {
            await sendEmail({
              to: assessment.email,
              subject: template.subject || `Quick check-in (Day ${message.day})`,
              html
            });

            // Mark as sent
            await supabase
              .from('check_in_queue')
              .update({
                status: 'sent',
                sent_at: new Date().toISOString()
              })
              .eq('id', message.id);

            result.sent++;
            log("dispatch_sent", { assessmentId: message.assessment_id.substring(0, 8), day: message.day });
          } catch (sendError: any) {
            // Mark as failed
            await supabase
              .from('check_in_queue')
              .update({
                status: 'failed',
                last_error: sendError.message || 'Unknown send error'
              })
              .eq('id', message.id);

            result.failed++;
            result.errors?.push(`Send failed for ${message.id}: ${sendError.message}`);
            log("dispatch_send_error", { messageId: message.id, err: sendError.message }, "error");
          }
        }
      } catch (error: any) {
        log("dispatch_message_error", { messageId: message.id, err: error.message }, "error");
        result.failed++;
        result.errors?.push(`Processing error for ${message.id}: ${error.message}`);
      }
    }

    log("dispatch_complete", {
      sent: result.sent,
      failed: result.failed,
      skipped: result.skipped,
      errors: result.errors?.length || 0
    });
    return result;
  } catch (error: any) {
    log("dispatch_error", { err: error.message }, "error");
    result.errors?.push(`Dispatch error: ${error.message}`);
    return result;
  }
}

/**
 * Compose the email HTML with template substitutions
 */
function composeEmailHtml(params: {
  template: any;
  insert: string;
  encouragement: string;
  assessmentId: string;
  day: CheckInDay;
}): string {
  const { template, insert, encouragement, assessmentId, day } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://painoptix.com';

  // Get logo HTML with absolute URL
  const logoHtml = resolveLogoFragment(appUrl);

  // Generate one-tap links with source tracking
  const values: CheckInValue[] = ['better', 'same', 'worse'];
  const links = values.map(value => {
    const token = sign({
      assessment_id: assessmentId,
      day,
      value
    });
    return {
      value,
      url: `${appUrl}/c/i?token=${token}&source=checkin_d${day}`,
      label: value === 'better' ? 'Feeling Better' :
             value === 'same' ? 'About the Same' :
             'Feeling Worse'
    };
  });

  // Process the shell text with placeholders
  let content = template.shell_text || '';
  content = content.replace('{{insert}}', `<div style="margin: 20px 0; padding: 18px; border: 1px solid #0B539422; background: #EFF5FF; border-radius: 12px;">${insert}</div>`);
  content = content.replace('{{encouragement}}', `<div style="margin: 20px 0; padding: 18px; border: 1px dashed #0B539455; background: #FFFFFF; border-radius: 12px;"><strong style="display:block;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:6px;">Encouragement</strong>${encouragement}</div>`);

  // Convert to HTML with proper formatting
  const lines = content.split('\n');
  const htmlLines = lines.map((line: string) => {
    if (line.trim() === '') return '';
    return `<p style="margin: 0 0 18px; font-size: 16px; line-height: 1.65; color: #1F2937;">${line}</p>`;
  }).filter((line: string) => line);

  // Add the one-tap buttons
  const buttonsHtml = links.map(link =>
    `<a href="${link.url}" style="display: inline-block; margin: 0 12px 12px 0; padding: 12px 20px; border-radius: 999px; font-weight: 600; font-size: 15px; letter-spacing: 0.02em; text-decoration: none; background: ${
      link.value === 'better' ? '#0B5394' :
      link.value === 'same' ? '#F3F4F6' :
      '#FEE2E2'
    }; color: ${
      link.value === 'better' ? '#FFFFFF' :
      link.value === 'same' ? '#111827' :
      '#991B1B'
    }; border: 1px solid ${
      link.value === 'better' ? '#0B5394' :
      link.value === 'same' ? '#CBD5E1' :
      '#FCA5A5'
    };">${link.label}</a>`
  ).join('');

  // Full HTML email template matching preview style
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${template.subject || `Day ${day} Check-In`}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 24px; background: #F6F8FB; font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #1F2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; border-collapse: collapse;">
    <tr>
      <td style="padding: 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background: #FFFFFF; border-radius: 16px; box-shadow: 0 16px 40px rgba(33, 56, 82, 0.08); border: 1px solid #E2E8F5; overflow: hidden;">
          <tr>
            <td style="padding: 32px 32px 28px 32px;">
              <div style="margin: 0 0 20px 0; text-align: center;">${logoHtml}</div>
              <h1 style="margin: 0 0 24px 0; font-size: 26px; line-height: 1.3; color: #0B5394;">${template.subject || `Day ${day} Check-In`}</h1>
              ${htmlLines.join('\n')}
              <div style="margin: 24px 0;">
                <h3 style="margin-bottom: 20px; font-size: 18px; color: #1F2937;">How are you feeling today?</h3>
                ${buttonsHtml}
              </div>
              <div style="margin-top: 28px; border-top: 1px solid #E2E8F5; padding-top: 16px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #6B7280;">${template.disclaimer_text || 'Educational use only. Not a diagnosis or treatment. If symptoms worsen or new symptoms develop, seek medical care.'}</p>
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