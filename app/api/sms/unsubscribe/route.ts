import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { logger } from '@/lib/logger'

// Twilio webhook handler for SMS STOP requests
export async function POST(req: NextRequest) {
  const supabase = supabaseAdmin();
  try {
    // Parse Twilio webhook data (application/x-www-form-urlencoded)
    const formData = await req.formData()
    const body = Object.fromEntries(formData)
    
    logger.info('SMS webhook received', { 
      from: body.From,
      body: body.Body,
      messageSid: body.MessageSid 
    })
    
    // Extract phone number and message
    const phoneNumber = body.From as string
    const messageBody = (body.Body as string || '').toUpperCase().trim()
    
    // Check if this is a STOP request
    const stopKeywords = ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']
    const isStopRequest = stopKeywords.includes(messageBody)
    
    if (!isStopRequest) {
      // Not a stop request, return empty response
      return new NextResponse('', { 
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      })
    }
    
    // Process opt-out
    logger.info('Processing SMS opt-out', { phoneNumber })
    
    // 1. Add to opt-out table
    // Removed duplicate: const supabase = supabaseAdmin();
    const { error: optOutError } = await supabase
      .from('sms_opt_outs')
      .upsert({
        phone_number: phoneNumber,
        opted_out_at: new Date().toISOString(),
        opt_out_source: 'sms_stop'
      }, {
        onConflict: 'phone_number'
      })
    
    if (optOutError) {
      logger.error('Failed to record SMS opt-out', optOutError)
      // Don't throw - we still want to update assessments
    }
    
    // 2. Update any existing assessments with this phone number
    const { error: assessmentError } = await supabase
      .from('assessments')
      .update({ sms_opted_out: true })
      .eq('phone_number', phoneNumber)
    
    if (assessmentError) {
      logger.error('Failed to update assessment opt-out status', assessmentError)
    }
    
    // 3. Return Twilio-compatible response
    // Twilio expects an empty 200 response or TwiML
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>You have been unsubscribed from PainOptix SMS messages. Reply START to resubscribe.</Message>
</Response>`
    
    return new NextResponse(twimlResponse, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml'
      }
    })
    
  } catch (error) {
    logger.error('SMS webhook error', error)
    
    // Return 200 to prevent Twilio retries on error
    return new NextResponse('', { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}

// Handle GET requests for webhook configuration verification
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'PainOptix SMS unsubscribe webhook is active',
    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/sms/unsubscribe`,
    instructions: 'Configure this URL in your Twilio Messaging Service or Phone Number settings'
  })
}