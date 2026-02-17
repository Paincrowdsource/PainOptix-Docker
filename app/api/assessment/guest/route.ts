import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceSupabase } from '@/lib/supabase';
import { EducationalGuideSelector } from '@/lib/algorithm/educational-guide-selector';
import { sanitizeError } from '@/lib/validation';

const guestAssessmentSchema = z.object({
  sessionId: z.string().uuid(),
  responses: z
    .array(
      z.object({
        questionId: z.string().min(1),
        question: z.string().min(1),
        answer: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
      }),
    )
    .min(1)
    .max(50),
  referrerSource: z.string().max(50).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, responses, referrerSource } = guestAssessmentSchema.parse(body);

    const selector = new EducationalGuideSelector();
    responses.forEach((response) => {
      selector.addResponse(response.questionId, response.question, response.answer);
    });

    const guideType = selector.selectEducationalGuide();
    const session = selector.getSession();

    const enrichedResponses = responses.map((response) => ({
      questionId: response.questionId,
      question: response.question,
      answer: response.answer,
      answerType: Array.isArray(response.answer) ? 'multi' : 'single',
    }));

    const supabase = getServiceSupabase();

    const { data: existingAssessment, error: existingAssessmentError } = await supabase
      .from('assessments')
      .select('id, is_guest')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingAssessmentError) {
      throw existingAssessmentError;
    }

    if (existingAssessment && existingAssessment.is_guest === false) {
      return NextResponse.json({
        success: true,
        assessmentId: existingAssessment.id,
        guideType,
      });
    }

    if (existingAssessment) {
      const { data: updated, error: updateError } = await supabase
        .from('assessments')
        .update({
          responses: enrichedResponses,
          disclosures: session.disclosures,
          guide_type: guideType,
          referrer_source: referrerSource || 'organic',
          is_guest: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAssessment.id)
        .select('id')
        .single();

      if (updateError || !updated) {
        throw updateError || new Error('Failed to update guest assessment');
      }

      return NextResponse.json({
        success: true,
        assessmentId: updated.id,
        guideType,
      });
    }

    const { data: inserted, error: insertError } = await supabase
      .from('assessments')
      .insert({
        session_id: sessionId,
        responses: enrichedResponses,
        disclosures: session.disclosures,
        guide_type: guideType,
        referrer_source: referrerSource || 'organic',
        contact_consent: false,
        is_guest: true,
        payment_tier: 'free',
        payment_completed: false,
        enrolled_in_paincrowdsource: false,
      })
      .select('id')
      .single();

    if (insertError || !inserted) {
      throw insertError || new Error('Failed to create guest assessment');
    }

    return NextResponse.json({
      success: true,
      assessmentId: inserted.id,
      guideType,
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
