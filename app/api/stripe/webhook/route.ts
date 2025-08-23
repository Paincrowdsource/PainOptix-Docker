export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getServiceSupabase } from '@/lib/supabase'
import { headers } from 'next/headers'
import { logger, logHelpers } from '@/lib/logger'
import { sendEmail } from '@/lib/comm/email'
import { logEvent } from '@/lib/logging'
import { getEnhancedConfirmationTemplate } from '@/lib/email/templates/enhanced-confirmation'
import { getMonographConfirmationTemplate } from '@/lib/email/templates/monograph-confirmation'
import { resolveTierAndFlags } from '@/lib/email/resolve-tier'
import { logCommunication } from '@/lib/comm/communication-logs'
import fs from 'fs'
import path from 'path'

// One-time dev warning if old path exists
if (process.env.NODE_ENV === 'development') {
  const oldPath = path.join(process.cwd(), 'app/api/stripe-webhook')
  if (fs.existsSync(oldPath)) {
    console.warn('⚠️ WARNING: Both /api/stripe-webhook and /api/stripe/webhook exist!')
    console.warn('Remove app/api/stripe-webhook/ directory to avoid confusion.')
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!
  
  let event: any

  try {
    // IMPORTANT: Keep signature verification unchanged
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    logger.error('Webhook signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = getServiceSupabase()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const { assessmentId, tierPrice, tierName, guideType, email, phone, initial_pain_score } = session.metadata

        // Update assessment with payment info
        // Map tierName to database enum values (comprehensive for $20)
        let dbPaymentTier = tierName || 'enhanced';
        if (tierName === 'monograph' || tierPrice === '20') {
          dbPaymentTier = 'comprehensive';
        } else if (tierName === 'enhanced' || tierPrice === '5') {
          dbPaymentTier = 'enhanced';
        }
        
        const { error: updateError } = await supabase
          .from('assessments')
          .update({
            payment_tier: dbPaymentTier,
            payment_completed: true,
            stripe_session_id: session.id
          })
          .eq('id', assessmentId)
        
        if (updateError) {
          logger.error('Failed to update assessment with payment', updateError)
          throw updateError
        }

        // Get assessment results for email template
        const { data: assessmentData } = await supabase
          .from('assessments')
          .select('*, assessment_results(*)')
          .eq('id', assessmentId)
          .single()

        const assessmentResults = {
          assessmentId,
          diagnosis: assessmentData?.assessment_results?.primary_diagnosis,
          severity: assessmentData?.assessment_results?.severity,
          duration: assessmentData?.assessment_results?.duration,
          ...assessmentData?.assessment_results
        }

        // Determine product from session
        const productPriceId = session.line_items?.data?.[0]?.price?.id || 
                              session.metadata?.product_id ||
                              (tierPrice === '5' ? process.env.STRIPE_PRICE_ENHANCED : 
                               tierPrice === '20' ? process.env.STRIPE_PRICE_MONOGRAPH : null)

        // Send confirmation email and schedule follow-up based on tier
        if (productPriceId === process.env.STRIPE_PRICE_ENHANCED || tierPrice === '5') {
          // Enhanced ($5) purchase
          if (email) {
            await sendEmail(
              email,
              'Your Enhanced Educational Report is Ready',
              getEnhancedConfirmationTemplate({ assessmentResults, userTier: 'enhanced' })
            )
            
            // Log to communication_logs
            await logCommunication({
              assessmentId,
              templateKey: 'enhanced_confirmation',
              status: 'sent',
              channel: 'email',
              recipient: email,
              subject: 'Your Enhanced Educational Report is Ready'
            })
            
            await logEvent('email_sent_stripe_confirmation', { 
              assessmentId, 
              tier: 'enhanced' 
            })
          }

          // Cancel any pending free follow-ups
          const { data: cancelledCount } = await supabase.rpc('cancel_pending_followups', {
            p_assessment_id: assessmentId,
            p_types: ['free_d3', 'free_d14']
          })
          
          if (cancelledCount > 0) {
            await logEvent('followups_cancelled_on_upgrade', {
              assessmentId,
              cancelledCount,
              upgradeTo: 'enhanced'
            })
          }

          // Schedule Day 4 follow-up
          const runAt = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
          await supabase
            .from('follow_ups')
            .insert({
              assessment_id: assessmentId,
              type: 'enhanced_d4',
              run_at: runAt,
              sent: false
            })
          await logEvent('email_followup_scheduled', { assessmentId, type: 'enhanced_d4' })
        }

        if (productPriceId === process.env.STRIPE_PRICE_MONOGRAPH || tierPrice === '20') {
          // Monograph ($20) purchase
          if (email) {
            await sendEmail(
              email,
              'Your Complete Educational Monograph is Ready',
              getMonographConfirmationTemplate({ assessmentResults, userTier: 'monograph' })
            )
            
            // Log to communication_logs
            await logCommunication({
              assessmentId,
              templateKey: 'monograph_confirmation',
              status: 'sent',
              channel: 'email',
              recipient: email,
              subject: 'Your Complete Educational Monograph is Ready'
            })
            
            await logEvent('email_sent_stripe_confirmation', { 
              assessmentId, 
              tier: 'monograph' 
            })
          }

          // Cancel any pending lower-tier follow-ups
          const { data: cancelledCount } = await supabase.rpc('cancel_pending_followups', {
            p_assessment_id: assessmentId,
            p_types: ['free_d3', 'free_d14', 'enhanced_d4']
          })
          
          if (cancelledCount > 0) {
            await logEvent('followups_cancelled_on_upgrade', {
              assessmentId,
              cancelledCount,
              upgradeTo: 'monograph'
            })
          }

          // Schedule Day 7 follow-up for monograph
          const runAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          await supabase
            .from('follow_ups')
            .insert({
              assessment_id: assessmentId,
              type: 'mono_d7',
              run_at: runAt,
              sent: false
            })
          await logEvent('email_followup_scheduled', { assessmentId, type: 'mono_d7' })
        }

        // If $5 or $20 purchase, queue for PainCrowdsource enrollment (preserve existing logic)
        if (parseInt(tierPrice) >= 5) {
          const anonId = `PNF-${generateRandomString(4)}-${generateRandomString(4)}`
          
          await supabase
            .from('assessments')
            .update({
              enrolled_in_paincrowdsource: true,
              paincrowdsource_id: anonId
            })
            .eq('id', assessmentId)

          await supabase
            .from('paincrowdsource_sync_queue')
            .insert({
              assessment_id: assessmentId,
              anon_id: anonId,
              guide_type: guideType,
              initial_pain_score: initial_pain_score,
              status: 'pending'
            })
        }

        // Update health status for successful webhook processing
        await supabase.rpc('update_health_status', {
          p_key: 'stripe_webhook_last_success',
          p_timestamp: new Date().toISOString()
        })
        
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        logHelpers.payment('failed', paymentIntent.id, { reason: paymentIntent.last_payment_error })
        break
      }

      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object
        break
      }

      default: {
        // Unhandled webhook event type
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.apiError('POST /api/stripe/webhook', error, { eventType: event?.type })
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}