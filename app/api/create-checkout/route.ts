export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getServiceSupabase } from '@/lib/supabase'
import { getAppUrl, joinUrlPaths } from '@/lib/utils/url'

export async function POST(req: NextRequest) {
  try {
    const { assessmentId, priceId, tierPrice } = await req.json()
    
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
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: priceId === 'monograph' 
                ? 'Comprehensive Pain Monograph' 
                : 'Enhanced Educational Guide',
              description: `Detailed guide for ${assessment.guide_type.replace(/_/g, ' ')}`,
            },
            unit_amount: tierPrice * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: joinUrlPaths(getAppUrl(), 'guide', assessmentId, '?payment=success'),
      cancel_url: joinUrlPaths(getAppUrl(), 'guide', assessmentId, 'upgrade'),
      metadata: {
        assessmentId,
        tierPrice: tierPrice.toString(),
        tierName: priceId === 'monograph' ? 'comprehensive' : 'enhanced',
        guideType: assessment.guide_type,
        email: assessment.email || '',
        phone: assessment.phone_number || ''
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