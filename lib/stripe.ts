import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

function getStripeServer(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-06-30.basil',
    })
  }
  return stripeInstance
}

export const stripe = {
  get checkout() {
    return getStripeServer().checkout
  },
  get webhooks() {
    return getStripeServer().webhooks
  },
  get charges() {
    return getStripeServer().charges
  }
}

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