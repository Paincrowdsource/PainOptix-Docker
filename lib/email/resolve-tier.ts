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
      // Note: Database uses 'comprehensive' for $20 tier, code uses 'monograph'
      if (assessment?.payment_tier === 'enhanced' || assessment?.payment_tier === 5) {
        tier = 'enhanced';
      } else if (assessment?.payment_tier === 'monograph' || assessment?.payment_tier === 'comprehensive' || assessment?.payment_tier === 20) {
        tier = 'monograph';
      }
    } catch (err) {
      // Continue with defaults if assessment not found
    }
  }

  // Check payment_logs table for highest tier (overrides payment_tier)
  try {
    const { data: payments } = await supabase
      .from('payment_logs')
      .select('tier')
      .eq('assessment_id', assessmentId)
      .eq('status', 'succeeded')
      .order('created_at', { ascending: false });

    if (payments && payments.length > 0) {
      // Get the most recent successful payment tier
      const paymentTier = payments[0].tier;

      // Payment tier overrides assessment tier (monograph > enhanced > free)
      if (paymentTier === 'monograph') {
        tier = 'monograph';
      } else if (paymentTier === 'enhanced') {
        tier = 'enhanced';
      }
    }
  } catch (err) {
    // Continue with tier from payment_tier if payment_logs query fails
  }

  return { tier, redFlag };
}