export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { logEvent } from '@/lib/logging';
import { 
  sendEnhancedFollowUp, 
  sendMonographFollowUp, 
  sendFreeFollowUp,
  sendFreeD14FollowUp
} from '@/lib/email/sequences';
import { resolveTierAndFlags } from '@/lib/email/resolve-tier';
import { logCommunication } from '@/lib/comm/communication-logs';

export async function POST(req: NextRequest) {
  try {
    // Verify scheduler token
    const token = req.headers.get('x-scheduler-token');
    if (token !== process.env.SCHEDULER_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = getServiceSupabase();

    // Get all due follow-ups
    const { data: due, error: fetchError } = await supabase
      .from('follow_ups')
      .select('*')
      .lte('run_at', new Date().toISOString())
      .eq('sent', false);

    if (fetchError) {
      await logEvent('email_scheduler_error', { error: fetchError.message });
      throw fetchError;
    }

    let processed = 0;
    let errors = 0;

    // Process each follow-up
    for (const row of due ?? []) {
      try {
        // Double-check to avoid race conditions
        const { data: current } = await supabase
          .from('follow_ups')
          .select('sent')
          .eq('id', row.id)
          .single();

        if (current?.sent) {
          await logEvent('email_followup_already_sent', { followUpId: row.id });
          continue;
        }

        // Check current tier and flags before sending marketing emails
        const marketingTypes = ['free_d3', 'free_d14', 'enhanced_d4', 'mono_d7'];
        let shouldSuppress = false;
        let suppressReason = '';
        
        if (marketingTypes.includes(row.type)) {
          const { tier, redFlag } = await resolveTierAndFlags(supabase, row.assessment_id);
          
          // Check for red flags
          if (redFlag) {
            shouldSuppress = true;
            suppressReason = 'red_flags';
          }
          
          // Check for tier upgrades (don't send lower tier emails to higher tier users)
          if (!shouldSuppress) {
            if (row.type.startsWith('free_') && (tier === 'enhanced' || tier === 'monograph')) {
              shouldSuppress = true;
              suppressReason = 'upgraded_tier';
            } else if (row.type === 'enhanced_d4' && tier === 'monograph') {
              shouldSuppress = true;
              suppressReason = 'upgraded_tier';
            }
          }
          
          // Check marketing opt-out
          if (!shouldSuppress) {
            const { data: assessment } = await supabase
              .from('assessments')
              .select('marketing_opted_out')
              .eq('id', row.assessment_id)
              .single();
            
            if (assessment?.marketing_opted_out) {
              shouldSuppress = true;
              suppressReason = 'opted_out';
            }
          }
        }
        
        // If suppressed, mark as sent but log the suppression
        if (shouldSuppress) {
          await logCommunication({
            assessmentId: row.assessment_id,
            templateKey: row.type,
            status: 'suppressed',
            metadata: { reason: suppressReason }
          });
          
          await logEvent('email_followup_suppressed', {
            followUpId: row.id,
            type: row.type,
            reason: suppressReason
          });
          
          // Mark as sent to prevent retries
          await supabase
            .from('follow_ups')
            .update({ 
              sent: true, 
              emailed_at: new Date().toISOString() 
            })
            .eq('id', row.id);
          
          continue;
        }
        
        // Send appropriate follow-up based on type
        let emailSent = false;
        
        switch (row.type) {
          case 'enhanced_d4':
            await sendEnhancedFollowUp(row.assessment_id);
            emailSent = true;
            break;
            
          case 'mono_d7':
            await sendMonographFollowUp(row.assessment_id);
            emailSent = true;
            break;
            
          case 'free_d3':
            await sendFreeFollowUp(row.assessment_id);
            emailSent = true;
            break;
            
          case 'free_d14':
            await sendFreeD14FollowUp(row.assessment_id);
            emailSent = true;
            break;
            
          default:
            await logEvent('email_followup_unknown_type', { 
              type: row.type, 
              followUpId: row.id 
            });
        }

        if (emailSent) {
          // Log to communication_logs
          await logCommunication({
            assessmentId: row.assessment_id,
            templateKey: row.type,
            status: 'sent',
            channel: 'email'
          });
          
          // Mark as sent
          const { error: updateError } = await supabase
            .from('follow_ups')
            .update({ 
              sent: true, 
              emailed_at: new Date().toISOString() 
            })
            .eq('id', row.id);

          if (updateError) {
            await logEvent('email_followup_update_error', { 
              followUpId: row.id, 
              error: updateError.message 
            });
            errors++;
          } else {
            await logEvent('email_sent', { 
              assessmentId: row.assessment_id, 
              type: row.type,
              followUpId: row.id
            });
            processed++;
          }
        }
      } catch (rowError) {
        errors++;
        await logEvent('email_followup_send_error', { 
          followUpId: row.id,
          type: row.type,
          error: rowError instanceof Error ? rowError.message : 'Unknown error'
        });
      }
    }

    // Update health status
    await supabase.rpc('update_health_status', {
      p_key: 'scheduler_last_run',
      p_timestamp: new Date().toISOString()
    });
    
    await logEvent('email_scheduler_completed', { 
      total: due?.length || 0,
      processed,
      errors
    });

    return NextResponse.json({ 
      ok: true,
      processed,
      errors,
      total: due?.length || 0
    });

  } catch (error) {
    await logEvent('email_scheduler_fatal_error', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    return NextResponse.json(
      { ok: false, error: 'Scheduler failed' },
      { status: 500 }
    );
  }
}