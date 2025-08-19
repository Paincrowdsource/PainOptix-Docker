import { SupabaseClient } from '@supabase/supabase-js';

export type Tier = 'free' | 'enhanced' | 'monograph';

interface TierAndFlags {
  tier: Tier;
  redFlag: boolean;
}

/**
 * Dual-path query to resolve tier and red flags
 * Tries multiple sources to handle different DB shapes
 */
export async function resolveTierAndFlags(
  supabase: SupabaseClient,
  assessmentId: string
): Promise<TierAndFlags> {
  // Defaults
  let redFlag = false;
  let tier: Tier = 'free';

  // Try assessment_results table first (newer schema)
  try {
    const { data: ar } = await supabase
      .from('assessment_results')
      .select('has_red_flags')
      .eq('assessment_id', assessmentId)
      .single();
    
    if (ar?.has_red_flags != null) {
      redFlag = !!ar.has_red_flags;
    }
  } catch (err) {
    // Silent fallback - table might not exist
  }

  // Fallback to assessments table columns
  if (!redFlag) {
    try {
      const { data: assessment } = await supabase
        .from('assessments')
        .select('has_red_flags, payment_tier')
        .eq('id', assessmentId)
        .single();
      
      if (assessment?.has_red_flags != null) {
        redFlag = !!assessment.has_red_flags;
      }
      
      // Check payment_tier field
      if (assessment?.payment_tier === 'enhanced' || assessment?.payment_tier === 5) {
        tier = 'enhanced';
      } else if (assessment?.payment_tier === 'monograph' || assessment?.payment_tier === 20) {
        tier = 'monograph';
      }
    } catch (err) {
      // Continue with defaults if assessment not found
    }
  }

  // Check purchases table for highest tier (overrides payment_tier)
  try {
    const { data: purchases } = await supabase
      .from('purchases')
      .select('price_id, product_id')
      .eq('assessment_id', assessmentId);
    
    if (purchases && purchases.length > 0) {
      const priceIds = purchases.map(p => p.price_id || p.product_id);
      
      // Check for monograph first (highest tier)
      if (priceIds.includes(process.env.STRIPE_PRICE_MONOGRAPH!)) {
        tier = 'monograph';
      } else if (priceIds.includes(process.env.STRIPE_PRICE_ENHANCED!)) {
        tier = 'enhanced';
      }
      
      // Also check legacy price IDs if different
      if (process.env.STRIPE_PRICE_MONOGRAPH_LEGACY) {
        if (priceIds.includes(process.env.STRIPE_PRICE_MONOGRAPH_LEGACY)) {
          tier = 'monograph';
        }
      }
      if (process.env.STRIPE_PRICE_ENHANCED_LEGACY) {
        if (priceIds.includes(process.env.STRIPE_PRICE_ENHANCED_LEGACY)) {
          tier = 'enhanced';
        }
      }
    }
  } catch (err) {
    // Continue with tier from payment_tier if purchases fails
  }

  return { tier, redFlag };
}