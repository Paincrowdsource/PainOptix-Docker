import { cookies } from 'next/headers';

export type PilotEligibilityInput = {
  sourceTag: string;
  normalizedTier: 'comprehensive' | 'enhanced' | string;
  requestedTierPriceCents?: number | null;
};

export function getPilotConfig() {
  const serverActive = process.env.PILOT_SERVER_ACTIVE === 'true';
  const allowedCents = Number(process.env.NEXT_PUBLIC_PILOT_MONO_PRICE_CENTS ?? '500');
  return { serverActive, allowedCents };
}

export function hasPilotCookie(): boolean {
  try {
    return cookies().get('pilot')?.value === '1';
  } catch {
    return false;
  }
}

export function isPilotEligible(input: PilotEligibilityInput): boolean {
  const { serverActive, allowedCents } = getPilotConfig();

  // Must have server flag enabled
  if (!serverActive) return false;

  // Must have pilot cookie
  if (!hasPilotCookie()) return false;

  // Must be from homepage_pilot source
  if (input.sourceTag !== 'homepage_pilot') return false;

  // Must be comprehensive or enhanced tier
  if (input.normalizedTier !== 'comprehensive' && input.normalizedTier !== 'enhanced') {
    return false;
  }

  // Optional: only honor if client asked exactly for allowedCents
  // This prevents arbitrary price manipulation
  if (typeof input.requestedTierPriceCents === 'number' && input.requestedTierPriceCents !== allowedCents) {
    return false;
  }

  return true;
}
