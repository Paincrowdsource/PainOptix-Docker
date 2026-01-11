import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { EducationalGuideSelector } from '@/lib/algorithm/educational-guide-selector'
import { deliverEducationalGuide } from '@/lib/guide-delivery'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { assessmentSubmissionSchema, assessmentUpdateSchema, sanitizeError } from '@/lib/validation'
import { z } from 'zod'
import { logger, logHelpers } from '@/lib/logger'

export async function POST(req: NextRequest) {
  // Assessment submission received
  
  try {
    const body = await req.json()
    
    // Debug logging only in development
    logger.debug('Assessment submission received', { 
      responseCount: body.responses?.length,
      hasEmail: !!body.email,
      hasSms: !!body.smsOptIn 
    })
    
    // Validate input
    const validatedData = assessmentSubmissionSchema.parse(body)
    const {
      responses, name, contactMethod, email, phoneNumber,
      initialPainScore, referrerSource, smsOptIn, deliveryMethod
    } = validatedData

    // Create the selector and process responses
    const selector = new EducationalGuideSelector()

    // Add all responses to selector
    responses.forEach((response: any) => {
      selector.addResponse(response.questionId, response.question, response.answer)
    })

    // Get the selected guide
    const guideType = selector.selectEducationalGuide()
    const session = selector.getSession()
    const reasoning = selector.getReasoning()

    // Log diagnosis reasoning for AI audit trail
    logger.info('Diagnosis reasoning', {
      assessmentSessionId: session.sessionId,
      ...reasoning
    })

    // Detect if answer was originally multi-select (for ML metadata)
    const detectAnswerType = (answer: any): 'single' | 'multi' => {
      if (Array.isArray(answer)) {
        return 'multi';
      }
      return 'single';
    };

    // Enrich responses with answerType metadata for ML training (backward compatible)
    const enrichedResponses = responses.map((r: any) => ({
      questionId: r.questionId,
      question: r.question,
      answer: r.answer, // Keep original format for backward compatibility
      answerType: detectAnswerType(r.answer) // NEW: aids ML feature extraction
    }));

    // Bug 1 Fix: Server-side guard - never allow SMS delivery without phone
    // This is a belt-and-suspenders check in addition to Zod validation
    if (deliveryMethod === 'sms' && !phoneNumber) {
      logger.warn('SMS delivery requested without phone number', {
        deliveryMethod,
        hasPhone: !!phoneNumber,
        hasSmsOptIn: smsOptIn
      })
      return NextResponse.json(
        { error: 'Phone number required for SMS delivery' },
        { status: 400 }
      )
    }

    // Create assessment record
    const supabase = getServiceSupabase()

    // ==========================================================
    // PHASE 1 PIVOT: Deduplication with Phone Priority
    // ==========================================================
    // Check if user already exists - prevents duplicate research_ids
    // Priority: Phone first, then email (only if no phone provided)
    let existingAssessment: { id: string; research_id: string | null } | null = null

    if (phoneNumber) {
      // Primary: Match by phone_number
      const { data } = await supabase
        .from('assessments')
        .select('id, research_id')
        .eq('phone_number', phoneNumber)
        .single()
      existingAssessment = data
      if (data) {
        logger.info('Dedup: Found existing assessment by phone', {
          existingId: data.id,
          researchId: data.research_id
        })
      }
    }

    // Fall-through: If no match by phone AND email provided, check email
    // This handles the case where user converts from email-only to SMS
    if (!existingAssessment && email) {
      const { data } = await supabase
        .from('assessments')
        .select('id, research_id')
        .eq('email', email)
        .single()
      existingAssessment = data
      if (data) {
        logger.info('Dedup: Found existing assessment by email (fall-through)', {
          existingId: data.id,
          researchId: data.research_id
        })
      }
    }

    let assessment: any
    let error: any

    // Bug 2 Fix: Track if this is an update where user added SMS consent
    let isUpdateWithNewSmsConsent = false

    if (existingAssessment) {
      // UPDATE existing row - preserve research_id
      logger.info('Dedup: Updating existing assessment', { id: existingAssessment.id })

      // Bug 2 Fix: Check if user is NOW requesting SMS but didn't have it before
      // We'll check if they already received SMS after the update
      const hasNewSmsConsent = smsOptIn && phoneNumber && deliveryMethod === 'sms'
      if (hasNewSmsConsent) {
        // Check if SMS was already sent for this assessment
        const { data: existingSmsLogs } = await supabase
          .from('communication_logs')
          .select('id')
          .eq('assessment_id', existingAssessment.id)
          .eq('channel', 'sms')
          .limit(1)

        if (!existingSmsLogs || existingSmsLogs.length === 0) {
          logger.info('Bug 2 Fix: User added SMS consent, will re-trigger SMS delivery', {
            assessmentId: existingAssessment.id
          })
          isUpdateWithNewSmsConsent = true
        }
      }

      const result = await supabase
        .from('assessments')
        .update({
          name: name || null,
          // Merge contact info: update email/phone if provided (handles email→SMS conversion)
          email: email || undefined,
          phone_number: phoneNumber || undefined,
          responses: enrichedResponses, // Use enriched responses with answerType metadata
          disclosures: session.disclosures,
          guide_type: guideType,
          initial_pain_score: initialPainScore,
          sms_opt_in: smsOptIn || false,
          delivery_method: deliveryMethod || 'sms',
          sms_consent_timestamp: smsOptIn ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
          // Phase 1 Pivot: Force monograph tier for everyone
          payment_tier: 'comprehensive',
          payment_completed: true,
        })
        .eq('id', existingAssessment.id)
        .select()
        .single()
      assessment = result.data
      error = result.error
    } else {
      // INSERT new row - DB trigger assigns research_id
      logger.info('Dedup: Creating new assessment')
      const result = await supabase
        .from('assessments')
        .insert({
          session_id: session.sessionId,
          name: name || null,
          email: email || null,
          phone_number: phoneNumber || null,
          contact_consent: true,
          responses: enrichedResponses, // Use enriched responses with answerType metadata
          disclosures: session.disclosures,
          guide_type: guideType,
          initial_pain_score: initialPainScore,
          referrer_source: referrerSource || 'organic',
          sms_opt_in: smsOptIn || false,
          delivery_method: deliveryMethod || 'sms',
          sms_consent_timestamp: smsOptIn ? new Date().toISOString() : null,
          // Phase 1 Pivot: Force monograph tier for everyone
          payment_tier: 'comprehensive',
          payment_completed: true,
          enrolled_in_paincrowdsource: false
        })
        .select()
        .single()
      assessment = result.data
      error = result.error
    }
    // ==========================================================
    // END PHASE 1 PIVOT
    // ==========================================================

    if (error) {
      logger.error('Failed to save assessment', { error })
      throw error
    }

    logger.info('Assessment saved', {
      id: assessment.id,
      researchId: assessment.research_id,
      isUpdate: !!existingAssessment
    })

    // Queue the guide delivery
    const { error: deliveryError } = await supabase
      .from('guide_deliveries')
      .insert({
        assessment_id: assessment.id,
        delivery_method: contactMethod,
        delivery_status: 'pending'
      })

    if (deliveryError) throw deliveryError

    // Trigger guide delivery
    // Bug 2 Fix: Force SMS if this is an update where user added SMS consent
    await deliverEducationalGuide(assessment.id, {
      forceSms: isUpdateWithNewSmsConsent
    })

    // Auto-enqueue check-ins if enabled
    if (process.env.CHECKINS_AUTOWIRE === '1' && process.env.CHECKINS_ENABLED === '1') {
      try {
        const { enqueueCheckinsForAssessment } = await import('@/lib/checkins/enqueue');
        await enqueueCheckinsForAssessment(assessment.id);
        logger.info('Check-ins auto-enqueued', { assessmentId: assessment.id });
      } catch (err) {
        // Don't fail assessment creation if check-in enqueue fails
        logger.error('Failed to auto-enqueue check-ins', { assessmentId: assessment.id, error: err });
      }
    }

    return NextResponse.json({
      success: true,
      assessmentId: assessment.id,
      guideType: guideType,
      message: `Your Educational Guide has been sent to your ${contactMethod}`
    })

  } catch (error) {
    logger.apiError('POST /api/assessment', error)
    
    // Enhanced error handling for debugging
    if (error instanceof z.ZodError) {
      logger.error('Validation error details:', {
        issues: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      })
      
      // Return detailed error in development
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: error.format(),
            issues: error.issues.map(issue => ({
              path: issue.path,
              message: issue.message,
              code: issue.code
            }))
          },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: sanitizeError(error) },
      { status: 400 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate input
    const validatedData = assessmentUpdateSchema.parse(body)
    const { id, ...updates } = validatedData
    
    if (!id) {
      return NextResponse.json(
        { error: 'Assessment ID required' },
        { status: 400 }
      )
    }
    
    // Use admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('assessments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Failed to update assessment')
      return NextResponse.json(
        { error: 'Failed to update assessment' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Assessment update failed')
    return NextResponse.json(
      { error: sanitizeError(error) },
      { status: 400 }
    )
  }
}