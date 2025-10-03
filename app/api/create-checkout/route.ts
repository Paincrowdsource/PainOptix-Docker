import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getServiceSupabase } from '@/lib/supabase'
import { getAppUrl, joinUrlPaths } from '@/lib/utils/url'

export async function POST(req: NextRequest) {
  try {
    const { assessmentId, priceId, tierPrice, source, bundleType } = await req.json()

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

    // Determine product type and details
    const isConsultation = bundleType === 'comprehensive' || priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_BUNDLE_350
    const isMonograph = priceId === 'monograph'
    const isEnhanced = priceId === 'enhanced'

    let productName: string
    let productDescription: string
    let amount: number
    let tierName: string
    let successUrl: string

    if (isConsultation) {
      productName = 'Professional Consultation with Dr. Carpentier'
      productDescription = '45-minute phone consultation to discuss your back pain condition'
      amount = 350 * 100 // $350 in cents
      tierName = 'consultation'
      successUrl = joinUrlPaths(getAppUrl(), 'consultation-success', `?assessment=${assessmentId}`)
    } else if (isMonograph) {
      productName = 'Comprehensive Pain Monograph'
      productDescription = `Detailed guide for ${assessment.guide_type.replace(/_/g, ' ')}`
      amount = (tierPrice || 20) * 100
      tierName = 'comprehensive'
      successUrl = joinUrlPaths(getAppUrl(), 'guide', assessmentId, '?payment=success')
    } else {
      productName = 'Enhanced Educational Guide'
      productDescription = `Detailed guide for ${assessment.guide_type.replace(/_/g, ' ')}`
      amount = (tierPrice || 5) * 100
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
            unit_amount: amount,
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
        tierPrice: (amount / 100).toString(),
        tierName,
        guideType: assessment.guide_type,
        email: assessment.email || '',
        phone: assessment.phone_number || '',
        source: source || 'direct',
        productType: isConsultation ? 'consultation' : 'guide'
      }
    })
    
    // Store stripe session ID
    await supabase
      .from('assessments')
      .update({ stripe_session_id: session.id })
      .eq('id', assessmentId)
    
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}