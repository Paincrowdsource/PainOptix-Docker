import { EducationalGuide } from '@/types/algorithm';

export interface PatternInsights {
  insight1: string;
  insight2: string;
}

export const PATTERN_INSIGHTS: Record<EducationalGuide, PatternInsights> = {
  sciatica: {
    insight1: 'Your pain triggers suggest a nerve-related mechanical pattern.',
    insight2:
      'Your relief factors indicate a condition that typically responds well to targeted positioning strategies.',
  },
  facet_arthropathy: {
    insight1: 'Your pain triggers suggest a joint-related mechanical pattern.',
    insight2:
      'Your relief factors indicate a condition that typically responds well to movement-based strategies.',
  },
  muscular_nslbp: {
    insight1: 'Your pain pattern suggests a muscular mechanical origin.',
    insight2:
      'Your relief factors indicate a condition that typically responds well to structured movement.',
  },
  canal_stenosis: {
    insight1: 'Your pain pattern suggests a positional mechanical origin.',
    insight2:
      'Your relief factors indicate a condition that typically responds well to postural adjustments.',
  },
  central_disc_bulge: {
    insight1: 'Your pain triggers suggest a disc-related mechanical pattern.',
    insight2:
      'Your relief factors indicate a condition that typically responds well to position management.',
  },
  lumbar_instability: {
    insight1: 'Your pain triggers suggest a stability-related mechanical pattern.',
    insight2:
      'Your relief factors indicate a condition that typically responds well to targeted strengthening.',
  },
  upper_lumbar_radiculopathy: {
    insight1: 'Your pain pattern suggests an upper nerve-related mechanical origin.',
    insight2:
      'Your relief factors indicate a condition that typically responds well to guided recovery.',
  },
  si_joint_dysfunction: {
    insight1: 'Your pain triggers suggest a pelvic joint-related mechanical pattern.',
    insight2:
      'Your relief factors indicate a condition that typically responds well to stabilization strategies.',
  },
  urgent_symptoms: {
    insight1: 'Your responses indicate symptoms that require prompt medical evaluation.',
    insight2: 'A detailed guide with next steps and questions for your doctor is ready.',
  },
};

export function getPatternInsights(guide: EducationalGuide): PatternInsights {
  return PATTERN_INSIGHTS[guide];
}
