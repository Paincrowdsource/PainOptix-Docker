/**
 * Tier name mapping utilities
 * 
 * The database uses 'comprehensive' but URLs and user-facing text use 'monograph'
 * These utilities ensure consistent mapping between the two
 */

export type DbTier = 'free' | 'enhanced' | 'comprehensive';
export type UrlTier = 'free' | 'enhanced' | 'monograph';

/**
 * Map URL parameter tier name to database tier name
 */
export function mapUrlTierToDb(urlTier: string): DbTier {
  if (urlTier === 'monograph') return 'comprehensive';
  if (urlTier === 'free' || urlTier === 'enhanced') return urlTier as DbTier;
  // Default to free for invalid values
  return 'free';
}

/**
 * Map database tier name to URL parameter tier name
 */
export function mapDbTierToUrl(dbTier: string): UrlTier {
  if (dbTier === 'comprehensive') return 'monograph';
  if (dbTier === 'free' || dbTier === 'enhanced') return dbTier as UrlTier;
  // Default to free for invalid values
  return 'free';
}

/**
 * Check if a tier is the highest (monograph/comprehensive) tier
 */
export function isHighestTier(tier: string): boolean {
  return tier === 'comprehensive' || tier === 'monograph';
}

/**
 * Get display name for a tier
 */
export function getTierDisplayName(tier: string): string {
  switch (tier) {
    case 'free':
      return 'Basic Guide';
    case 'enhanced':
      return 'Enhanced Guide';
    case 'comprehensive':
    case 'monograph':
      return 'Comprehensive Monograph';
    default:
      return 'Guide';
  }
}

/**
 * Get tier price
 */
export function getTierPrice(tier: string): number {
  switch (tier) {
    case 'free':
      return 0;
    case 'enhanced':
      return 5;
    case 'comprehensive':
    case 'monograph':
      return 20;
    default:
      return 0;
  }
}