import { getServiceSupabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface SmsOptOutResult {
  success: boolean;
  phoneNumber: string;
  origin: string;
  assessmentsUpdated: number;
}

function normalizePhoneNumber(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  if (phoneNumber.startsWith('+')) {
    return `+${digits}`;
  }
  return phoneNumber.trim();
}

export async function processSmsOptOut(
  phoneNumber: string,
  origin: string
): Promise<SmsOptOutResult> {
  const supabase = getServiceSupabase();
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  const { error: optOutError } = await supabase
    .from('sms_opt_outs')
    .upsert(
      {
        phone_number: normalizedPhone,
        opted_out_at: new Date().toISOString(),
        opt_out_source: origin,
      },
      {
        onConflict: 'phone_number',
      }
    );

  if (optOutError) {
    logger.error('Failed to record SMS opt-out', optOutError);
    throw optOutError;
  }

  const nowIso = new Date().toISOString();

  let assessmentsUpdated = 0;

  const { data: normalizedUpdated, error: normalizedUpdateError } = await supabase
    .from('assessments')
    .update({
      sms_opted_out: true,
      sms_opt_in: false,
      updated_at: nowIso,
    })
    .eq('phone_number', normalizedPhone)
    .select('id');

  if (normalizedUpdateError) {
    logger.error('Failed to update SMS opt-out status (normalized)', normalizedUpdateError);
    throw normalizedUpdateError;
  }

  assessmentsUpdated += normalizedUpdated?.length || 0;

  if (normalizedPhone !== phoneNumber.trim()) {
    const { data: rawUpdated, error: rawUpdateError } = await supabase
      .from('assessments')
      .update({
        sms_opted_out: true,
        sms_opt_in: false,
        updated_at: nowIso,
      })
      .eq('phone_number', phoneNumber.trim())
      .select('id');

    if (rawUpdateError) {
      logger.error('Failed to update SMS opt-out status (raw)', rawUpdateError);
      throw rawUpdateError;
    }

    assessmentsUpdated += rawUpdated?.length || 0;
  }

  return {
    success: true,
    phoneNumber: normalizedPhone,
    origin,
    assessmentsUpdated,
  };
}
