import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getServiceSupabase } from '@/lib/supabase'
import { headers } from 'next/headers'
import { logger, logHelpers } from '@/lib/logger'

export async function POST(req: NextRequest) {
  // Stripe webhook received
  
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!
  
  // Processing webhook
  
  // Webhook body received
  
  let event: any

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    // Webhook signature verified
  } catch (err: any) {
    logger.error('Webhook signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = getServiceSupabase()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        // Checkout session completed
        
        const { assessmentId, tierPrice, tierName, guideType, email, phone } = session.metadata

        // Update assessment with payment info
        // Updating assessment with payment tier
        const { error: updateError } = await supabase
          .from('assessments')
          .update({
            payment_tier: tierName || 'enhanced', // Use enum value
            payment_completed: true,
            stripe_session_id: session.id
          })
          .eq('id', assessmentId)
        
        if (updateError) {
          logger.error('Failed to update assessment with payment', updateError)
          throw updateError
        }
        // Assessment payment status updated

        // If $5 or $20 purchase, queue for PainCrowdsource enrollment
        if (parseInt(tierPrice) >= 5) {
          const anonId = `PNF-${generateRandomString(4)}-${generateRandomString(4)}`
          // Enrolling in PainCrowdsource
          
          await supabase
            .from('assessments')
            .update({
              enrolled_in_paincrowdsource: true,
              paincrowdsource_id: anonId
            })
            .eq('id', assessmentId)

          // Queue for sync (we'll implement the actual sync next)
          await supabase
            .from('paincrowdsource_sync_queue')
            .insert({
              assessment_id: assessmentId,
              anon_id: anonId,
              guide_type: guideType,
              initial_pain_score: session.metadata.initial_pain_score,
              status: 'pending'
            })
        }

        // Send confirmation email
        if (email) {
          // Payment confirmation processed
        }

        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        // Payment intent succeeded
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
        // Payment session expired or failed
        break
      }

      default: {
        // Unhandled webhook event type
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.apiError('POST /api/stripe-webhook', error, { eventType: event?.type })
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