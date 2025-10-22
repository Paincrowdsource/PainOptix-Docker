import { getServiceSupabase } from '@/lib/supabase';
import type { CheckInDay } from './token';

interface EnqueueResult {
  created: number;
  skippedReason?: string;
}

/**
 * Compute due_at timestamp for a check-in
 * Target: 10:00 AM America/New_York on the specified day
 * @param createdAt The assessment creation timestamp
 * @param day Number of days after assessment (3, 7, or 14)
 * @returns UTC timestamp for when the check-in should be sent
 */
function computeDueAt(createdAt: string, day: CheckInDay): Date {
  const created = new Date(createdAt);
  const dueDate = new Date(created);

  // Add the specified number of days
  dueDate.setDate(dueDate.getDate() + day);

  // Set to 10:00 AM in UTC (approximating Eastern time)
  // Note: This is a simplified approach. In production, you might want to use
  // a proper timezone library like date-fns-tz or luxon for accurate timezone handling
  // For now, using UTC-5 (EST) or UTC-4 (EDT) approximation
  dueDate.setUTCHours(15, 0, 0, 0); // 10:00 AM EST = 15:00 UTC

  return dueDate;
}

/**
 * Enqueue check-ins for an assessment
 * Creates entries in check_in_queue for days 3, 7, and 14
 * @param assessmentId The assessment ID to enqueue check-ins for
 * @returns Result with number of entries created or skip reason
 */
export async function enqueueCheckinsForAssessment(
  assessmentId: string
): Promise<EnqueueResult> {
  // Check if feature is enabled
  if (process.env.CHECKINS_ENABLED !== '1') {
    return { created: 0, skippedReason: 'disabled' };
  }

  const supabase = getServiceSupabase();

  try {
    // Get assessment details
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, created_at, email, phone_number, guide_type')
      .eq('id', assessmentId)
      .single();

    if (assessmentError || !assessment) {
      console.error('Assessment not found:', assessmentId);
      return { created: 0, skippedReason: 'assessment_not_found' };
    }

    // Skip check-ins for urgent_symptoms assessments (these users need immediate medical attention)
    if (assessment.guide_type === 'urgent_symptoms') {
      console.info(`Skipping check-ins for ${assessmentId}: urgent_symptoms guide type`);
      return { created: 0, skippedReason: 'urgent_symptoms' };
    }

    // Check if user has made any purchases (should suppress check-ins)
    const { data: purchases, error: purchasesError } = await supabase
      .from('payment_logs')
      .select('id')
      .eq('assessment_id', assessmentId)
      .eq('status', 'succeeded')
      .limit(1);

    if (!purchasesError && purchases && purchases.length > 0) {
      console.info(`Skipping check-ins for ${assessmentId}: user has purchases`);
      return { created: 0, skippedReason: 'purchased' };
    }

    // Determine channel (prefer email over SMS)
    const channel = assessment.email ? 'email' : assessment.phone_number ? 'sms' : null;

    if (!channel) {
      console.error('No contact method available for assessment:', assessmentId);
      return { created: 0, skippedReason: 'no_contact' };
    }

    // Prepare queue entries for days 3, 7, and 14
    // Using 'same' variant as default for first check-in (more neutral than 'initial')
    const days: CheckInDay[] = [3, 7, 14];
    const queueEntries = days.map(day => ({
      assessment_id: assessmentId,
      day,
      due_at: computeDueAt(assessment.created_at, day).toISOString(),
      template_key: `day${day}.same`,
      channel,
      status: 'queued'
    }));

    // Upsert entries (idempotent - won't create duplicates)
    const { data: inserted, error: insertError } = await supabase
      .from('check_in_queue')
      .upsert(queueEntries, {
        onConflict: 'assessment_id,day',
        ignoreDuplicates: false // Update existing rows with new due_at if needed
      })
      .select();

    if (insertError) {
      console.error('Failed to enqueue check-ins:', insertError);
      return { created: 0, skippedReason: 'database_error' };
    }

    const created = inserted?.length || 0;
    console.info(`Enqueued ${created} check-ins for assessment ${assessmentId}`);

    return { created };
  } catch (error) {
    console.error('Enqueue error:', error);
    return { created: 0, skippedReason: 'unknown_error' };
  }
}