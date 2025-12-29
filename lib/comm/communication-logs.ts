import { getServiceSupabase } from '@/lib/supabase';
import { logEvent } from '@/lib/logging';

export interface CommunicationLogEntry {
  assessmentId: string;
  templateKey: string;
  status: 'sent' | 'suppressed' | 'failed' | 'pending';
  channel?: 'email' | 'sms';
  providerId?: string;
  recipient?: string;
  subject?: string;
  message?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Log communication events to communication_logs table for Admin dashboard
 * This is separate from logEvent() which is for system logging
 */
export async function logCommunication(entry: CommunicationLogEntry) {
  const supabase = getServiceSupabase();
  
  try {
    // Never log actual email addresses - hash them
    let hashedRecipient: string | undefined;
    if (entry.recipient) {
      const crypto = await import('crypto');
      hashedRecipient = crypto
        .createHash('sha256')
        .update(entry.recipient.toLowerCase())
        .digest('hex')
        .substring(0, 12) + '...';
    }
    
    const { error } = await supabase
      .from('communication_logs')
      .insert({
        assessment_id: entry.assessmentId,
        type: entry.templateKey, // 'type' column stores template key
        template_key: entry.templateKey,
        status: entry.status,
        channel: entry.channel || 'email',
        provider: (entry.channel === 'sms') ? 'twilio' : 'sendgrid',
        provider_message_id: entry.providerId,
        recipient: hashedRecipient,
        subject: entry.subject,
        message: entry.message?.substring(0, 500), // Truncate for storage
        error_message: entry.errorMessage,
        metadata: entry.metadata,
        sent_at: entry.status === 'sent' ? new Date().toISOString() : null,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      await logEvent('communication_log_write_failed', { 
        error: error.message,
        assessmentId: entry.assessmentId,
        templateKey: entry.templateKey
      });
    }
  } catch (err) {
    // Don't throw - logging should not break the main flow
    await logEvent('communication_log_error', { 
      error: err instanceof Error ? err.message : 'Unknown error',
      assessmentId: entry.assessmentId
    });
  }
}

/**
 * Mark an email as opened (for engagement tracking)
 */
export async function markEmailOpened(assessmentId: string, providerId: string) {
  const supabase = getServiceSupabase();
  
  try {
    await supabase
      .from('communication_logs')
      .update({ 
        opened_at: new Date().toISOString() 
      })
      .eq('assessment_id', assessmentId)
      .eq('provider_message_id', providerId)
      .is('opened_at', null);
    
    await logEvent('email_opened', { assessmentId });
  } catch (err) {
    await logEvent('mark_opened_error', { 
      error: err instanceof Error ? err.message : 'Unknown error' 
    });
  }
}

/**
 * Mark an email as clicked (for engagement tracking)
 */
export async function markEmailClicked(assessmentId: string, providerId: string) {
  const supabase = getServiceSupabase();
  
  try {
    await supabase
      .from('communication_logs')
      .update({ 
        clicked_at: new Date().toISOString(),
        opened_at: new Date().toISOString() // Click implies open
      })
      .eq('assessment_id', assessmentId)
      .eq('provider_message_id', providerId)
      .is('clicked_at', null);
    
    await logEvent('email_clicked', { assessmentId });
  } catch (err) {
    await logEvent('mark_clicked_error', { 
      error: err instanceof Error ? err.message : 'Unknown error' 
    });
  }
}

/**
 * Check if user has engaged with any emails for this assessment
 */
export async function hasEngagement(assessmentId: string): Promise<boolean> {
  const supabase = getServiceSupabase();
  
  try {
    const { data, error } = await supabase.rpc('has_email_engagement', {
      p_assessment_id: assessmentId
    });
    
    if (error) {
      await logEvent('engagement_check_error', { 
        error: error.message,
        assessmentId 
      });
      return false;
    }
    
    return data === true;
  } catch (err) {
    await logEvent('engagement_check_failed', { 
      error: err instanceof Error ? err.message : 'Unknown error',
      assessmentId
    });
    return false;
  }
}