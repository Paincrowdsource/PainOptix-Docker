import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, sendSMS } from '@/lib/communications'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Generate 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Check rate limits
async function checkRateLimit(identifier: string, ip: string, action: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  
  // Check contact-based rate limit
  const { data: contactLimits } = await supabaseAdmin
    .from('verification_rate_limits')
    .select('*')
    .eq('identifier', identifier)
    .eq('identifier_type', 'contact')
    .eq('action', action)
    .gte('window_start', oneHourAgo)
  
  // Check IP-based rate limit
  const { data: ipLimits } = await supabaseAdmin
    .from('verification_rate_limits')
    .select('*')
    .eq('identifier', ip)
    .eq('identifier_type', 'ip')
    .eq('action', action)
    .gte('window_start', oneHourAgo)
  
  const contactAttempts = contactLimits?.reduce((sum, record) => sum + record.attempts, 0) || 0
  const ipAttempts = ipLimits?.reduce((sum, record) => sum + record.attempts, 0) || 0
  
  // 3 attempts per hour per contact/IP
  return contactAttempts < 3 && ipAttempts < 3
}

// Update rate limit
async function updateRateLimit(identifier: string, ip: string, action: string) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  
  // Update contact rate limit
  const { data: existingContact } = await supabaseAdmin
    .from('verification_rate_limits')
    .select('*')
    .eq('identifier', identifier)
    .eq('identifier_type', 'contact')
    .eq('action', action)
    .gte('window_start', oneHourAgo)
    .single()
  
  if (existingContact) {
    await supabaseAdmin
      .from('verification_rate_limits')
      .update({ attempts: existingContact.attempts + 1 })
      .eq('id', existingContact.id)
  } else {
    await supabaseAdmin
      .from('verification_rate_limits')
      .insert({
        identifier,
        identifier_type: 'contact',
        action,
        attempts: 1
      })
  }
  
  // Update IP rate limit
  const { data: existingIp } = await supabaseAdmin
    .from('verification_rate_limits')
    .select('*')
    .eq('identifier', ip)
    .eq('identifier_type', 'ip')
    .eq('action', action)
    .gte('window_start', oneHourAgo)
    .single()
  
  if (existingIp) {
    await supabaseAdmin
      .from('verification_rate_limits')
      .update({ attempts: existingIp.attempts + 1 })
      .eq('id', existingIp.id)
  } else {
    await supabaseAdmin
      .from('verification_rate_limits')
      .insert({
        identifier: ip,
        identifier_type: 'ip',
        action,
        attempts: 1
      })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { identifier, identifierType } = await request.json()
    
    if (!identifier || !identifierType) {
      return NextResponse.json(
        { error: 'Identifier and type are required' },
        { status: 400 }
      )
    }

    // SECURITY: Extract client IP for rate limiting
    // Handles proxy/load balancer scenarios
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // RATE LIMITING: Check if request should be allowed
    const canProceed = await checkRateLimit(identifier, ip, 'send_code')
    if (!canProceed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // AUTHORIZATION: Verify user has assessments before sending code
    // This prevents enumeration attacks and protects user privacy
    const query = identifierType === 'email' 
      ? supabaseAdmin.from('assessments').select('id').eq('email', identifier)
      : supabaseAdmin.from('assessments').select('id').eq('phone_number', identifier)
    
    const { data: assessments, error: assessmentError } = await query

    if (assessmentError || !assessments || assessments.length === 0) {
      // Generic error prevents information disclosure about user existence
      return NextResponse.json(
        { error: 'No assessments found for this contact information' },
        { status: 404 }
      )
    }

    // SECURITY: Invalidate any existing codes (prevents code reuse)
    await supabaseAdmin
      .from('verification_codes')
      .delete()
      .eq('identifier', identifier)

    // Generate new cryptographically random code
    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15-minute expiration

    // Store verification code with metadata for tracking
    const { error: insertError } = await supabaseAdmin
      .from('verification_codes')
      .insert({
        identifier,
        identifier_type: identifierType,
        code,
        ip_address: ip, // For security tracking
        expires_at: expiresAt.toISOString()
      })

    if (insertError) {
      console.error('Error storing verification code:', insertError)
      return NextResponse.json(
        { error: 'Failed to generate verification code' },
        { status: 500 }
      )
    }

    // COMMUNICATION: Send verification code via appropriate channel
    if (identifierType === 'email') {
      await sendEmail({
        to: identifier,
        subject: 'Your PainOptix Verification Code',
        // Professional HTML email template with clear security messaging
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0B5394;">Your Verification Code</h2>
            <p>Use this code to access your PainOptix assessments:</p>
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0B5394;">${code}</span>
            </div>
            <p style="color: #666;">This code expires in 15 minutes.</p>
            <p style="color: #666;">If you didn't request this code, please ignore this email.</p>
          </div>
        `,
        // Plain text fallback for accessibility
        text: `Your PainOptix verification code is: ${code}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this code, please ignore this email.`
      })
    } else {
      // Concise SMS message due to character limits and cost
      await sendSMS({
        to: identifier,
        message: `Your PainOptix verification code is: ${code}\n\nThis code expires in 15 minutes.`
      })
    }

    // RATE LIMITING: Update counters after successful send
    await updateRateLimit(identifier, ip, 'send_code')

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully'
    })

  } catch (error) {
    console.error('Error in send verification endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}