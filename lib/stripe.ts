import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

// Price IDs for different tiers
export const PRICES = {
  enhanced: process.env.STRIPE_PRICE_ENHANCED || 'price_enhanced_guide',
  monograph: process.env.STRIPE_PRICE_MONOGRAPH || 'price_monograph_guide',
}

// Create Stripe instance for client-side
export const getStripe = () => {
  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
  if (!stripePublishableKey) {
    throw new Error('Missing Stripe publishable key')
  }
  return import('@stripe/stripe-js').then(({ loadStripe }) => 
    loadStripe(stripePublishableKey)
  )
}