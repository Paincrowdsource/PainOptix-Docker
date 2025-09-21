import Stripe from 'stripe';

const apiVersion: Stripe.LatestApiVersion = '2025-06-30.basil';

let stripeClient: Stripe | null = null;
function ensureStripe(): Stripe {
  if (!stripeClient) {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      throw new Error('Stripe secret key missing');
    }
    stripeClient = new Stripe(secret, { apiVersion });
  }
  return stripeClient;
}

/**
 * Provides a cached Stripe server client without instantiating at module load.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const client = ensureStripe();
    const value = Reflect.get(
      client as unknown as Record<PropertyKey, unknown>,
      prop,
      receiver,
    );
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export const PRICES = {
  enhanced: process.env.STRIPE_PRICE_ENHANCED || 'price_enhanced_guide',
  monograph: process.env.STRIPE_PRICE_MONOGRAPH || 'price_monograph_guide',
};

export const getStripe = () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error('Missing Stripe publishable key');
  }
  return import('@stripe/stripe-js').then(({ loadStripe }) => loadStripe(publishableKey));
};

export function getStripeServer(): Stripe {
  return ensureStripe();
}
