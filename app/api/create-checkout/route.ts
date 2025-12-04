import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { getServiceSupabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAppUrl, joinUrlPaths } from '@/lib/utils/url'
import { isPilotEligible, getPilotConfig, hasPilotCookie } from '@/lib/pilot.server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { assessmentId, priceId, tierPrice, source, bundleType, tier } = body

    // ==========================================================
    // PHASE 1 PIVOT: Payment Hibernation
    // ==========================================================
    // Skip Stripe checkout - everyone gets free access to monograph tier
    if (process.env.DISABLE_PAYMENTS === 'true') {
      const supabase = getServiceSupabase()

      // Update assessment to "paid" status without Stripe
      await supabase
        .from('assessments')
        .update({
          payment_tier: 'comprehensive',
          payment_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', assessmentId)

      // Return success URL directly (skip Stripe checkout)
      const baseUrl = getAppUrl()
      console.log('[PAYMENT HIBERNATION] Bypassing Stripe for assessment:', assessmentId)

      return NextResponse.json({
        url: joinUrlPaths(baseUrl, 'guide', assessmentId, '?payment=success'),
        hibernated: true  // Flag for debugging
      })
    }
    // ==========================================================
    // END PHASE 1 PIVOT
    // ==========================================================

    const supabase = getServiceSupabase()

    // Get assessment details
    const { data: assessment, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .single()

    if (error || !assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    // Parse request data
    const requestedTierPriceCents = typeof tierPrice === 'number' ? tierPrice : Number.parseInt(`${tierPrice ?? ''}`, 10)
    const sourceTag = typeof source === 'string' && source.length > 0 ? source : 'direct'
    const normalizedTier =
      typeof tier === 'string' && tier.length > 0
        ? tier
        : priceId === 'monograph'
          ? 'comprehensive'
          : priceId === 'enhanced'
            ? 'enhanced'
            : String(priceId || 'comprehensive')

    // Get pilot configuration
    const { allowedCents } = getPilotConfig()

    // Server-side pricing authority: check pilot eligibility
    const eligible = isPilotEligible({
      sourceTag,
      normalizedTier,
      requestedTierPriceCents: Number.isFinite(requestedTierPriceCents) ? requestedTierPriceCents : null
    })

    // Standard price map (server decides, not client)
    const STANDARD_PRICE_CENTS: Record<string, number> = {
      comprehensive: 2000,
      enhanced: 2000,
      consultation: 350 * 100
    }

    // Determine product type and details
    const isConsultation = bundleType === 'comprehensive' || priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_BUNDLE_350
    const isMonograph = priceId === 'monograph'
    const isEnhanced = priceId === 'enhanced'

    let productName: string
    let productDescription: string
    let amountCents: number
    let tierName: string
    let successUrl: string

    if (isConsultation) {
      productName = 'Professional Consultation with Dr. Carpentier'
      productDescription = '45-minute phone consultation to discuss your back pain condition'
      amountCents = STANDARD_PRICE_CENTS.consultation
      tierName = 'consultation'
      successUrl = joinUrlPaths(getAppUrl(), 'consultation-success', `?assessment=${assessmentId}`)
    } else if (isMonograph) {
      productName = 'Comprehensive Pain Monograph'
      productDescription = `Detailed guide for ${assessment.guide_type.replace(/_/g, ' ')}`
      // Server decides: pilot price if eligible, otherwise standard
      amountCents = eligible ? allowedCents : STANDARD_PRICE_CENTS.comprehensive
      tierName = 'comprehensive'
      successUrl = joinUrlPaths(getAppUrl(), 'guide', assessmentId, '?payment=success')
    } else {
      productName = 'Enhanced Educational Guide'
      productDescription = `Detailed guide for ${assessment.guide_type.replace(/_/g, ' ')}`
      // Server decides: pilot price if eligible, otherwise standard (FIX: was hardcoded to 500)
      amountCents = eligible ? allowedCents : STANDARD_PRICE_CENTS.enhanced
      tierName = 'enhanced'
      successUrl = joinUrlPaths(getAppUrl(), 'guide', assessmentId, '?payment=success')
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: productDescription,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: isConsultation
        ? joinUrlPaths(getAppUrl(), 'comprehensive-care', `?assessment=${assessmentId}`)
        : joinUrlPaths(getAppUrl(), 'guide', assessmentId, 'upgrade'),
      metadata: {
        assessmentId,
        tierPrice: (amountCents / 100).toString(),
        tierName,
        guideType: assessment.guide_type,
        email: assessment.email || '',
        phone: assessment.phone_number || '',
        source: sourceTag,
        productType: isConsultation ? 'consultation' : 'guide',
        // Server decision (not just source tag)
        price_strategy: eligible ? 'pilot' : 'standard',
        // Analytics fields reveal full context
        pilot_cookie: hasPilotCookie() ? '1' : '0',
        pilot_server_active: process.env.PILOT_SERVER_ACTIVE === 'true' ? '1' : '0',
        requested_tier_price_cents: Number.isFinite(requestedTierPriceCents) ? requestedTierPriceCents.toString() : '',
        normalized_tier: normalizedTier
      }
    })
    
    // Store stripe session ID
    await supabase
      .from('assessments')
      .update({ stripe_session_id: session.id })
      .eq('id', assessmentId)

    // Log pilot pricing decision for analytics (non-blocking)
    try {
      await supabaseAdmin
        .from('pilot_events')
        .insert({
          source: sourceTag,
          tier: normalizedTier,
          assessment_id: assessmentId,
          amount_cents: amountCents,
          price_strategy: eligible ? 'pilot' : 'standard',
          pilot_cookie: hasPilotCookie(),
          pilot_server_active: process.env.PILOT_SERVER_ACTIVE === 'true',
          checkout_session_id: session.id
        })
    } catch (pilotLogError) {
      // Non-blocking: log error but don't fail checkout
      console.error('pilot_events insert failed (non-blocking):', pilotLogError)
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
