export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { deleteConfirmSchema, sanitizeError } from '@/lib/validation'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate input
    const validatedData = deleteConfirmSchema.parse(body)
    const { identifier, verificationCode } = validatedData
    
    const supabase = getServiceSupabase()
    
    // Verify the code (must be less than 15 minutes old)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    
    const { data: request, error } = await supabase
      .from('deletion_requests')
      .select('*')
      .eq('identifier', identifier)
      .eq('verification_code', verificationCode)
      .eq('verified', false)
      .gte('requested_at', fifteenMinutesAgo)
      .single()
    
    if (error || !request) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
    }
    
    // Mark as verified
    await supabase
      .from('deletion_requests')
      .update({ verified: true })
      .eq('id', request.id)
    
    // Delete all data associated with this identifier
    if (identifier.includes('@')) {
      await supabase
        .from('assessments')
        .delete()
        .eq('email', identifier)
    } else {
      await supabase
        .from('assessments')
        .delete()
        .eq('phone_number', identifier)
    }
    
    // Mark deletion as complete
    await supabase
      .from('deletion_requests')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', request.id)
    
    // Send confirmation email/SMS
    const { sendEmail, sendSMS } = await import('@/lib/communications')
    
    if (identifier.includes('@')) {
      await sendEmail({
        to: identifier,
        subject: 'PainOptix Data Deletion Confirmed',
        html: `
          <h2>Your Data Has Been Deleted</h2>
          <p>This email confirms that all your assessment data has been permanently deleted from PainOptix systems.</p>
          <p><strong>What was deleted:</strong></p>
          <ul>
            <li>All assessment responses</li>
            <li>Personal information (name, email, phone)</li>
            <li>Any purchased guide information</li>
          </ul>
          <p><strong>What was retained:</strong></p>
          <ul>
            <li>This deletion request record for compliance purposes</li>
            <li>Anonymized data that cannot be linked to you</li>
          </ul>
          <p>If you have any questions, please contact support@painoptix.com</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            Deletion Request ID: ${request.id}<br>
            Completed at: ${new Date().toISOString()}
          </p>
        `,
        text: `Your Data Has Been Deleted\n\nThis confirms that all your assessment data has been permanently deleted from PainOptix systems.\n\nDeletion Request ID: ${request.id}\nCompleted at: ${new Date().toISOString()}`
      })
    } else {
      await sendSMS({
        to: identifier,
        message: `PainOptix: Your data deletion is complete. All assessment data has been permanently removed. Confirmation ID: ${request.id.slice(-6)}`
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete confirmation failed')
    return NextResponse.json({ error: sanitizeError(error) }, { status: 400 })
  }
}