import { createHmac } from 'crypto';

export type CheckInDay = 3 | 7 | 14;
export type CheckInValue = 'better' | 'same' | 'worse';

interface TokenPayload {
  assessment_id: string;
  day: CheckInDay;
  value: CheckInValue;
  exp?: number;
}

/**
 * Sign a payload with HMAC-SHA256
 * @param payload The data to sign
 * @param ttlSeconds Optional TTL in seconds (default: 7 days)
 * @returns Base64URL-encoded token
 */
export function sign(payload: TokenPayload, ttlSeconds: number = 7 * 24 * 60 * 60): string {
  const secret = process.env.CHECKINS_TOKEN_SECRET;
  if (!secret) {
    throw new Error('CHECKINS_TOKEN_SECRET not configured');
  }

  // Add expiration if TTL provided
  const payloadWithExp: TokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds
  };

  // Create payload string
  const payloadStr = JSON.stringify(payloadWithExp);
  const payloadBase64 = Buffer.from(payloadStr).toString('base64url');

  // Create HMAC signature
  const hmac = createHmac('sha256', secret);
  hmac.update(payloadBase64);
  const signature = hmac.digest('base64url');

  // Combine payload and signature
  return `${payloadBase64}.${signature}`;
}

/**
 * Verify and decode a token
 * @param token The token to verify
 * @returns Decoded payload if valid, null if invalid or expired
 */
export function verify(token: string): TokenPayload | null {
  const secret = process.env.CHECKINS_TOKEN_SECRET;
  if (!secret) {
    console.error('CHECKINS_TOKEN_SECRET not configured');
    return null;
  }

  try {
    // Split token into payload and signature
    const parts = token.split('.');
    if (parts.length !== 2) {
      console.error('Invalid token format');
      return null;
    }

    const [payloadBase64, providedSignature] = parts;

    // Verify signature
    const hmac = createHmac('sha256', secret);
    hmac.update(payloadBase64);
    const expectedSignature = hmac.digest('base64url');

    // Constant-time comparison to prevent timing attacks
    if (!constantTimeCompare(providedSignature, expectedSignature)) {
      console.error('Invalid token signature');
      return null;
    }

    // Decode payload
    const payloadStr = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadStr) as TokenPayload;

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.error('Token expired');
      return null;
    }

    // Validate payload structure
    if (!payload.assessment_id || !payload.day || !payload.value) {
      console.error('Invalid token payload structure');
      return null;
    }

    // Validate day value
    if (![3, 7, 14].includes(payload.day)) {
      console.error('Invalid day value in token');
      return null;
    }

    // Validate value
    if (!['better', 'same', 'worse'].includes(payload.value)) {
      console.error('Invalid value in token');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}