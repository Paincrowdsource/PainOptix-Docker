import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { logEvent } from '@/lib/logging'

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic';

/**
 * Twilio Status Callback Webhook
 *
 * Receives delivery status updates for SMS messages.
 * Twilio POSTs status updates at various stages:
 * - queued: Message is queued to be sent
 * - sent: Message has been sent to carrier
 * - delivered: Message confirmed delivered to device
 * - undelivered: Message could not be delivered
 * - failed: Message failed to send
 *
 * Error codes to watch for:
 * - 30003: Unreachable destination
 * - 30004: Message blocked
 * - 30005: Unknown destination
 * - 30006: Landline or unreachable carrier
 * - 30007: Carrier violation (filtered as spam)
 * - 30008: Unknown error
 */
export async function POST(req: NextRequest) {
  const supabase = getServiceSupabase()

  try {
    // Parse Twilio webhook data (application/x-www-form-urlencoded)
    const formData = await req.formData()
    const body = Object.fromEntries(formData)

    // Extract relevant fields from Twilio callback
    const messageSid = body.MessageSid as string
    const messageStatus = body.MessageStatus as string
    const errorCode = body.ErrorCode as string | undefined
    const errorMessage = body.ErrorMessage as string | undefined
    const to = body.To as string

    console.log('[Twilio Webhook] Status update received:', {
      sid: messageSid,
      status: messageStatus,
      errorCode,
      errorMessage,
      to
    })

    // Log event for monitoring
    await logEvent('twilio_status_callback', {
      messageSid,
      messageStatus,
      errorCode,
      errorMessage,
      to
    })

    // Map Twilio status to our status values
    let dbStatus: string
    switch (messageStatus) {
      case 'delivered':
        dbStatus = 'delivered'
        break
      case 'sent':
      case 'queued':
        dbStatus = 'sent' // Keep as sent until confirmed delivered
        break
      case 'undelivered':
      case 'failed':
        dbStatus = 'failed'
        break
      default:
        dbStatus = messageStatus
    }

    // Find and update the communication log by provider_message_id (the SID)
    const { data: existingLog, error: findError } = await supabase
      .from('communication_logs')
      .select('id, status')
      .eq('provider_message_id', messageSid)
      .single()

    if (findError && findError.code !== 'PGRST116') {
      console.error('[Twilio Webhook] Error finding log:', findError)
    }

    if (existingLog) {
      // Update the existing log
      const updateData: any = {
        status: dbStatus
      }

      // Add delivered_at timestamp if delivered
      if (messageStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString()
      }

      // Store error details if failed
      if (errorCode || errorMessage) {
        updateData.error_message = errorMessage || `Error code: ${errorCode}`
        updateData.metadata = {
          twilio_error_code: errorCode,
          twilio_error_message: errorMessage,
          twilio_status: messageStatus,
          updated_at: new Date().toISOString()
        }
      }

      const { error: updateError } = await supabase
        .from('communication_logs')
        .update(updateData)
        .eq('id', existingLog.id)

      if (updateError) {
        console.error('[Twilio Webhook] Error updating log:', updateError)
      } else {
        console.log('[Twilio Webhook] Updated communication log:', {
          id: existingLog.id,
          oldStatus: existingLog.status,
          newStatus: dbStatus
        })
      }

      // If this is a carrier filtering error (30007), log it prominently
      if (errorCode === '30007') {
        console.warn('[Twilio Webhook] CARRIER FILTERING DETECTED:', {
          sid: messageSid,
          to,
          errorCode,
          errorMessage
        })

        await logEvent('sms_carrier_filtered', {
          messageSid,
          to,
          errorCode,
          errorMessage
        })
      }
    } else {
      // Log that we couldn't find the message (might be old or from different system)
      console.log('[Twilio Webhook] No matching log found for SID:', messageSid)
    }

    // Return 200 OK to acknowledge receipt
    return new NextResponse('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    })

  } catch (error) {
    console.error('[Twilio Webhook] Error processing callback:', error)

    // Always return 200 to prevent Twilio retries
    // (retries would just fail again and waste resources)
    return new NextResponse('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}

// Health check endpoint
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'PainOptix Twilio Status Webhook is active',
    webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/twilio/webhook`,
    purpose: 'Receives delivery status updates for SMS messages',
    trackedStatuses: ['queued', 'sent', 'delivered', 'undelivered', 'failed'],
    monitoredErrorCodes: {
      '30003': 'Unreachable destination',
      '30004': 'Message blocked',
      '30005': 'Unknown destination',
      '30006': 'Landline or unreachable carrier',
      '30007': 'Carrier violation (filtered as spam)',
      '30008': 'Unknown error'
    }
  })
}
