import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { sendEmail, sendSMS } from '@/lib/communications'
import { deleteRequestSchema, sanitizeError } from '@/lib/validation'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate input
    const validatedData = deleteRequestSchema.parse(body)
    const { identifier } = validatedData
    
    const supabase = getServiceSupabase()
    
    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Store deletion request
    await supabase
      .from('deletion_requests')
      .insert({
        identifier,
        verification_code: verificationCode
      })
    
    // Send verification code
    if (identifier.includes('@')) {
      await sendEmail({
        to: identifier,
        subject: 'PainOptix Data Deletion Verification',
        html: `<p>Your verification code is: <strong>${verificationCode}</strong></p>
               <p>This code expires in 15 minutes.</p>`,
        text: `Your verification code is: ${verificationCode}\nThis code expires in 15 minutes.`
      })
    } else {
      await sendSMS({
        to: identifier,
        message: `PainOptix: Your data deletion code is ${verificationCode}. Expires in 15 minutes.`
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete request failed')
    return NextResponse.json({ error: sanitizeError(error) }, { status: 400 })
  }
}