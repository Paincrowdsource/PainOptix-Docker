/**
 * Content Mapping Configuration
 * 
 * Maps algorithm output guide types to Bradley's PDF content files.
 * Critical for ensuring the correct educational content is loaded.
 */

import { EducationalGuide } from '@/types/algorithm';

interface ContentMapping {
  displayName: string;
  free: {
    filename: string;
    bradleyPdfName: string;
  };
  enhanced: {
    filename: string;
    bradleyPdfName: string;
    notes?: string;
  };
}

export const CONTENT_MAPPING: Record<EducationalGuide, ContentMapping> = {
  'sciatica': {
    displayName: 'Sciatica',
    free: {
      filename: 'sciatica.md',
      bradleyPdfName: 'PainOptix Sciatica Education Guide.pdf'
    },
    enhanced: {
      filename: 'sciatica.md',
      bradleyPdfName: 'PainOptix™ Sciatica Monograph.pdf'
    }
  },
  
  'upper_lumbar_radiculopathy': {
    displayName: 'Upper Lumbar Radiculopathy',
    free: {
      filename: 'upper_lumbar_radiculopathy.md',
      bradleyPdfName: 'PainOptix Upper Lumbar Radiculopathy Education Guide.pdf'
    },
    enhanced: {
      filename: 'upper_lumbar_radiculopathy.md',
      bradleyPdfName: 'PainOptix Upper Lumbar Radiculopathy Monograph.pdf'
    }
  },
  
  'si_joint_dysfunction': {
    displayName: 'SI Joint Dysfunction',
    free: {
      filename: 'si_joint_dysfunction.md',
      bradleyPdfName: 'PainOptix SI Joint Dysfunction Education Guide.pdf'
    },
    enhanced: {
      filename: 'si_joint_dysfunction.md',
      bradleyPdfName: 'PainOptix™ Sacroiliac Joint Dysfunction Monograph.pdf'
    }
  },
  
  'canal_stenosis': {
    displayName: 'Canal Stenosis',
    free: {
      filename: 'canal_stenosis.md',
      bradleyPdfName: 'PainOptix Canal Stenosis Education Guide.pdf'
    },
    enhanced: {
      filename: 'canal_stenosis.md',
      bradleyPdfName: 'PainOptix Canal Stenosis Monograph.pdf'
    }
  },
  
  'central_disc_bulge': {
    displayName: 'Central Disc Bulge',
    free: {
      filename: 'central_disc_bulge.md',
      bradleyPdfName: 'PainOptix Central Disc Bulge Education Guide.pdf'
    },
    enhanced: {
      filename: 'central_disc_bulge.md',
      bradleyPdfName: 'PainOptix™ Central Disc Bulge Monograph.pdf'
    }
  },
  
  'facet_arthropathy': {
    displayName: 'Facet Arthropathy',
    free: {
      filename: 'facet_arthropathy.md',
      bradleyPdfName: 'PainOptix Facet Arthropathy Education Guide.pdf'
    },
    enhanced: {
      filename: 'facet_arthropathy.md',
      bradleyPdfName: 'PainOptix Facet Arthropathy Monograph.pdf'
    }
  },
  
  'muscular_nslbp': {
    displayName: 'Muscular/Non-Specific Low Back Pain',
    free: {
      filename: 'muscular_nslbp.md',
      bradleyPdfName: 'PainOptix Muscular_Non-Specific Low Back Pain Education Guide.pdf'
    },
    enhanced: {
      filename: 'muscular_nslbp.md',
      bradleyPdfName: 'PainOptix Muscular_Non-Specific Low Back Pain Monograph.pdf'
    }
  },
  
  'lumbar_instability': {
    displayName: 'Lumbar Instability',
    free: {
      filename: 'lumbar_instability.md',
      bradleyPdfName: 'PainOptix Lumbar Instability Education Guide.pdf'
    },
    enhanced: {
      filename: 'lumbar_instability.md',
      bradleyPdfName: 'PainOptix Lumbar Instability Monograph.pdf'
    }
  },
  
  'urgent_symptoms': {
    displayName: 'Urgent Symptoms',
    free: {
      filename: 'urgent_symptoms.md',
      bradleyPdfName: 'PainOptix Urgent Symptoms Education Guide.pdf'
    },
    enhanced: {
      filename: 'urgent_symptoms.md',
      bradleyPdfName: 'PainOptix Urgent Symptoms Education Guide (Long-Form).pdf',
      notes: 'No monograph provided; using Long-Form education guide as enhanced'
    }
  }
};

/**
 * Get the content file path for a guide type and tier
 */
export function getContentPath(guideType: EducationalGuide, tier: 'free' | 'enhanced'): string {
  const mapping = CONTENT_MAPPING[guideType];
  if (!mapping) {
    throw new Error(`No content mapping found for guide type: ${guideType}`);
  }
  
  const filename = tier === 'free' ? mapping.free.filename : mapping.enhanced.filename;
  return `/content/guides/${tier}/${filename}`;
}

/**
 * Get the display name for a guide type
 */
export function getGuideDisplayName(guideType: EducationalGuide): string {
  return CONTENT_MAPPING[guideType]?.displayName || guideType;
}

/**
 * Validate that all guide types have content mappings
 */
export function validateContentMappings(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const guideTypes: EducationalGuide[] = [
    'sciatica',
    'upper_lumbar_radiculopathy', 
    'si_joint_dysfunction',
    'canal_stenosis',
    'central_disc_bulge',
    'facet_arthropathy',
    'muscular_nslbp',
    'lumbar_instability',
    'urgent_symptoms'
  ];
  
  for (const guideType of guideTypes) {
    if (!CONTENT_MAPPING[guideType]) {
      errors.push(`Missing mapping for guide type: ${guideType}`);
    } else {
      const mapping = CONTENT_MAPPING[guideType];
      if (!mapping.free.filename) {
        errors.push(`Missing free tier filename for: ${guideType}`);
      }
      if (!mapping.enhanced.filename) {
        errors.push(`Missing enhanced tier filename for: ${guideType}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}