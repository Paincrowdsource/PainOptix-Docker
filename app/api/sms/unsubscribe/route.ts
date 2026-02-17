import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { processSmsOptOut } from '@/lib/sms/opt-out'

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic';

// Twilio webhook handler for SMS STOP requests
export async function POST(req: NextRequest) {
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
    const normalizedKeyword = messageBody.replace(/[^A-Z]/g, '')
    
    // Check if this is a STOP request
    const stopKeywords = ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']
    const isStopRequest = stopKeywords.includes(normalizedKeyword)
    
    if (!isStopRequest) {
      // Not a stop request, return empty response
      return new NextResponse('', { 
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      })
    }
    
    // Process opt-out
    logger.info('Processing SMS opt-out', { phoneNumber })
    
    await processSmsOptOut(phoneNumber, 'sms_stop_unsubscribe')
    
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
