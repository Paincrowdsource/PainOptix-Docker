import sgMail from '@sendgrid/mail'
import twilio from 'twilio'
import { features } from './config'
import { logger } from './logger'
import { supabaseAdmin } from './supabase-admin'

// Lazy initialize SendGrid to avoid build errors
let sendGridInitialized = false

function initSendGrid() {
  if (!sendGridInitialized && process.env.SENDGRID_API_KEY) {
    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY)
      sendGridInitialized = true
      logger.service('SendGrid', 'initialized')
    } catch (error) {
      logger.service('SendGrid', 'failed', error as string)
    }
  }
}

// Lazy initialize Twilio to avoid build errors
let twilioClient: any = null

function getTwilioClient() {
  if (!twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      logger.service('Twilio', 'initialized')
    } catch (error) {
      logger.service('Twilio', 'failed', error as string)
    }
  }
  return twilioClient
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text: string
}

interface SendSMSParams {
  to: string
  message: string
  skipOptOutCheck?: boolean // For system messages like opt-out confirmations
}

export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; messageId?: string }> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      logger.warn('SendGrid not configured, skipping email:', params.to)
      throw new Error('SendGrid API key not configured')
    }

    initSendGrid()

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(params.to)) {
      throw new Error(`Invalid email address format: ${params.to}`)
    }

    const msg = {
      to: params.to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@painoptix.com',
        name: process.env.SENDGRID_FROM_NAME || 'PainOptix'
      },
      subject: params.subject,
      text: params.text,
      html: params.html,
    }

    const [response] = await sgMail.send(msg)

    // Extract message ID from SendGrid response headers
    const messageId = response.headers?.['x-message-id'] as string | undefined

    logger.info('Email sent successfully', { to: params.to, messageId })
    return { success: true, messageId }
  } catch (error: any) {
    logger.error('Email send error', {
      to: params.to,
      error: error.message,
      code: error.code,
      response: error.response?.body
    })

    // Throw error with detailed message for better error tracking
    if (error.response?.body?.errors?.[0]) {
      const sgError = error.response.body.errors[0]
      throw new Error(`SendGrid error: ${sgError.message} (${error.code})`)
    } else if (error.message) {
      throw error
    } else {
      throw new Error('Unknown email sending error')
    }
  }
}

export async function sendSMS(params: SendSMSParams): Promise<boolean> {
  try {
    // Check if SMS is enabled
    if (!features.smsEnabled) {
      console.log('SMS is not enabled. Twilio not configured.')
      return false // Indicate SMS was not sent
    }
    
    const client = getTwilioClient()
    if (!client) {
      console.log('Twilio client initialization failed, skipping SMS:', params.to)
      return false
    }

    if (!process.env.TWILIO_MESSAGE_SERVICE_SID) {
      console.error('TWILIO_MESSAGE_SERVICE_SID is not configured')
      return false
    }

    // Format phone number
    let phoneNumber = params.to.replace(/\D/g, '')
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+1' + phoneNumber // Assume US number
    }

    // Check if user has opted out (unless this is a system message)
    if (!params.skipOptOutCheck) {
      try {
        const { data: optOut } = await supabaseAdmin
          .from('sms_opt_outs')
          .select('phone_number')
          .eq('phone_number', phoneNumber)
          .single()
        
        if (optOut) {
          logger.info('SMS blocked - user opted out', { phoneNumber })
          return false
        }
      } catch (error: any) {
        // If error is not "no rows", log it
        if (error.code !== 'PGRST116') {
          logger.error('Error checking SMS opt-out status', error)
        }
        // Continue sending if we can't verify opt-out status
      }
    }

    // Add STOP instructions if not already present
    let messageWithStop = params.message
    if (!messageWithStop.toLowerCase().includes('stop') && !params.skipOptOutCheck) {
      messageWithStop += ' Reply STOP to unsubscribe.'
    }

    await client.messages.create({
      body: messageWithStop,
      messagingServiceSid: process.env.TWILIO_MESSAGE_SERVICE_SID,
      to: phoneNumber
    })

    console.log('SMS sent successfully to:', phoneNumber)
    return true
  } catch (error) {
    console.error('SMS send error:', error)
    return false
  }
}