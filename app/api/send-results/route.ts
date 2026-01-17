import { NextRequest, NextResponse } from 'next/server';
import { getFreeTierWelcomeTemplate } from '@/lib/email/templates/free-tier-welcome';
import { getEnhancedConfirmationTemplate } from '@/lib/email/templates/enhanced-confirmation';
import { getMonographConfirmationTemplate } from '@/lib/email/templates/monograph-confirmation';
import { getRedFlagWarningTemplate } from '@/lib/email/templates/red-flag-warning';
import { sendEmail } from '@/lib/comm/email';
import { logEvent } from '@/lib/logging';
import { getServiceSupabase } from '@/lib/supabase';
import { resolveTierAndFlags } from '@/lib/email/resolve-tier';
import { logCommunication } from '@/lib/comm/communication-logs';

export async function POST(req: Request) {
  try {
    const { assessmentId, email, assessmentResults } = await req.json();
    
    if (!assessmentId || !email) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const supabase = getServiceSupabase();
    const { tier, redFlag } = await resolveTierAndFlags(supabase, assessmentId);
    
    let subject = '';
    let html = '';
    let emailType = '';
    
    if (redFlag) {
      // Red flag users get safety email only
      subject = 'Important: Healthcare Consultation Recommended';
      html = getRedFlagWarningTemplate({ assessmentResults, userTier: tier });
      emailType = 'safety_immediate';
      await logEvent('email_suppressed_red_flag', { assessmentId });
    } else {
      // Choose template based on tier
      if (tier === 'monograph') {
        subject = 'Your Complete Educational Monograph is Ready';
        html = getMonographConfirmationTemplate({ assessmentResults, userTier: tier });
        emailType = 'mono_immediate';
      } else if (tier === 'enhanced') {
        subject = 'Your Enhanced Educational Report is Ready';
        html = getEnhancedConfirmationTemplate({ assessmentResults, userTier: tier });
        emailType = 'enhanced_immediate';
      } else {
        subject = 'Your PainOptix Educational Assessment & Free Guide';
        html = getFreeTierWelcomeTemplate({ assessmentResults, userTier: tier });
        emailType = 'free_immediate';
      }
    }
    
    // Check marketing opt-out for marketing emails
    const isMarketing = ['free_d3', 'enhanced_d4', 'mono_d7'].includes(emailType);
    if (isMarketing) {
      const { data: assessment } = await supabase
        .from('assessments')
        .select('marketing_opted_out')
        .eq('id', assessmentId)
        .single();
      
      if (assessment?.marketing_opted_out) {
        await logEvent('email_suppressed_marketing_optout', { assessmentId, emailType });
        return NextResponse.json({ ok: true, suppressed: true });
      }
    }
    
    // Idempotency check using email_events table
    const dedupeKey = `${assessmentId}:${emailType}`;
    const { error: dupeError } = await supabase.rpc('claim_email_send', { 
      dedupe_key: dedupeKey 
    });
    
    if (dupeError) {
      await logEvent('email_send_skipped_duplicate', { dedupeKey });
      return NextResponse.json({ ok: true, duplicate: true });
    }
    
    // Send the email
    const emailResult = await sendEmail(email, subject, html);

    // Log to communication_logs for Admin dashboard
    await logCommunication({
      assessmentId,
      templateKey: emailType,
      status: 'sent',
      channel: 'email',
      providerId: emailResult.messageId,
      recipient: email,
      subject,
      message: html.substring(0, 500)
    });
    
    // Log the event
    await logEvent('email_segment_chosen', { 
      tier, 
      redFlag, 
      template: emailType,
      assessmentId
    });
    
    // Note: Legacy follow_ups table inserts removed 2025-01-17
    // The check_in_queue system now handles all follow-ups (days 3, 7, 14)

    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error('Send results error:', error);
    await logEvent('email_send_error', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return NextResponse.json(
      { ok: false, error: 'Failed to send results' },
      { status: 500 }
    );
  }
}