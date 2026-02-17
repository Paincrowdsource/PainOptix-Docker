import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceSupabase } from '@/lib/supabase';
import { deliverEducationalGuide } from '@/lib/guide-delivery';
import { sanitizeError } from '@/lib/validation';

const claimAssessmentSchema = z.object({
  assessmentId: z.string().uuid(),
  sessionId: z.string().uuid(),
  phoneNumber: z.string().regex(/^\+?1?\d{10,15}$/, 'Invalid phone number format'),
  email: z.string().email().optional(),
});

function normalizePhoneNumber(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  return phoneNumber;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assessmentId, sessionId, phoneNumber, email } = claimAssessmentSchema.parse(body);

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const supabase = getServiceSupabase();

    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .update({
        phone_number: normalizedPhone,
        email: email || undefined,
        is_guest: false,
        contact_consent: true,
        sms_opt_in: true,
        delivery_method: 'sms',
        sms_consent_timestamp: new Date().toISOString(),
        payment_tier: 'comprehensive',
        payment_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assessmentId)
      .eq('session_id', sessionId)
      .select('id')
      .maybeSingle();

    if (assessmentError) {
      throw assessmentError;
    }

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found for this session' },
        { status: 404 },
      );
    }

    const { data: deliveryRow, error: deliveryLookupError } = await supabase
      .from('guide_deliveries')
      .select('id')
      .eq('assessment_id', assessmentId)
      .limit(1)
      .maybeSingle();

    if (deliveryLookupError) {
      throw deliveryLookupError;
    }

    if (!deliveryRow) {
      const { error: insertDeliveryError } = await supabase.from('guide_deliveries').insert({
        assessment_id: assessmentId,
        delivery_method: 'sms',
        delivery_status: 'pending',
      });

      if (insertDeliveryError) {
        throw insertDeliveryError;
      }
    }

    await deliverEducationalGuide(assessmentId);

    if (process.env.CHECKINS_AUTOWIRE === '1' && process.env.CHECKINS_ENABLED === '1') {
      try {
        const { enqueueCheckinsForAssessment } = await import('@/lib/checkins/enqueue');
        await enqueueCheckinsForAssessment(assessmentId);
      } catch (error) {
        console.error('Failed to auto-enqueue check-ins after claim', error);
      }
    }

    return NextResponse.json({
      success: true,
      assessmentId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: sanitizeError(error) },
      { status: 400 },
    );
  }
}
