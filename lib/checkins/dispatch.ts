import { log } from '@/lib/logger';
import { getServiceSupabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/mailer/sendEmail';
import { sign, type CheckInDay, type CheckInValue } from './token';
import { isWithinSendWindow, isBeforeStartDate } from './time-utils';
import { resolveDiagnosisCode } from './diagnosis';
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

        // Get diagnosis insert (with fallback to generic)
        let { data: diagnosisInsert } = await supabase
          .from('diagnosis_inserts')
          .select('insert_text')
          .eq('diagnosis_code', diagnosisCode)
          .eq('day', message.day)
          .eq('branch', 'initial')
          .single();

        // Fallback to generic if specific diagnosis not found
        if (!diagnosisInsert) {
          const { data: genericInsert } = await supabase
            .from('diagnosis_inserts')
            .select('insert_text')
            .eq('diagnosis_code', 'generic')
            .eq('day', message.day)
            .eq('branch', 'initial')
            .single();
          diagnosisInsert = genericInsert;
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
      queued: result.queued,
      sent: result.sent,
      skipped: result.skipped,
      failed: result.failed,
      errorCount: result.errors?.length || 0
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
             'Feeling Worse',
      className: value === 'better' ? 'btn' :
                 value === 'same' ? 'btn neutral' :
                 'btn caution'
    };
  });

  // Build the HTML content
  let content = template.shell_text || '';

  // Replace placeholders
  content = content.replace('{{insert}}', insert);
  content = content.replace('{{encouragement}}', encouragement);

  // Convert to HTML with proper formatting
  const lines = content.split('\n');
  const htmlLines = lines.map((line: string) => {
    if (line.trim() === '') return '<br>';
    return `<p>${line}</p>`;
  });

  // Add the one-tap buttons
  const buttonsHtml = `
    <div style="text-align: center; margin: 30px 0;">
      <h3 style="margin-bottom: 20px;">How are you feeling today?</h3>
      ${links.map(link =>
        `<a href="${link.url}" class="${link.className}" style="text-decoration: none;">${link.label}</a>`
      ).join(' ')}
    </div>
  `;

  // Add disclaimer
  const disclaimerHtml = `
    <div class="disclaimer">
      ${template.disclaimer_text || 'Educational use only. Not a diagnosis or treatment. If symptoms worsen or new symptoms develop, seek medical care.'}
    </div>
  `;

  return `
    <h2>Day ${day} Check-In</h2>
    ${htmlLines.join('\n')}
    ${buttonsHtml}
    ${disclaimerHtml}
  `;
}