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
    const { responses, name, contactMethod, email, phoneNumber, initialPainScore, referrerSource } = validatedData
    
    // Contact info received

    // Create the selector and process responses
    const selector = new EducationalGuideSelector()
    
    // Add all responses to selector
    responses.forEach((response: any) => {
      selector.addResponse(response.questionId, response.question, response.answer)
    })

    // Get the selected guide
    const guideType = selector.selectEducationalGuide()
    const session = selector.getSession()
    
    // Guide type selected: guideType

    // Create assessment record
    const supabase = getServiceSupabase()
    
    // Saving assessment to database
    
    const { data: assessment, error } = await supabase
      .from('assessments')
      .insert({
        session_id: session.sessionId,
        name: name || null,
        email: email || null,
        phone_number: phoneNumber || null,
        contact_consent: true,
        responses: responses,
        disclosures: session.disclosures,
        guide_type: guideType,
        initial_pain_score: initialPainScore,
        referrer_source: referrerSource || 'organic',
        payment_tier: 'free',
        enrolled_in_paincrowdsource: false
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to save assessment')
      throw error
    }
    
    // Assessment saved successfully

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
    await deliverEducationalGuide(assessment.id)

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
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
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