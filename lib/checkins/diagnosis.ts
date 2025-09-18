/**
 * Diagnosis code resolution for check-in messages
 * Maps assessment guide_type to diagnosis codes for targeted messaging
 */

/**
 * Resolve diagnosis code from assessment data
 *
 * Source field: assessments.guide_type (string)
 *
 * Mapping table:
 * - 'facet_arthropathy' → 'facet_arthropathy'
 * - 'lumbar_instability' → 'lumbar_instability'
 * - 'muscular_nslbp' → 'nonspecific_lbp'
 * - 'sciatica' → 'sciatica'
 * - 'upper_lumbar_radiculopathy' → 'upper_lumbar_radiculopathy'
 * - 'si_joint_dysfunction' → 'si_joint_dysfunction'
 * - 'canal_stenosis' → 'canal_stenosis'
 * - 'central_disc_bulge' → 'central_disc_bulge'
 * - null/undefined/unknown → 'generic'
 *
 * @param assessment Assessment record with guide_type field
 * @returns Diagnosis code for check-in content selection
 */
export function resolveDiagnosisCode(assessment: { guide_type?: string | null }): string {
  const guideType = assessment.guide_type?.toLowerCase().trim();

  if (!guideType) {
    console.info('[Diagnosis] No guide_type found, using generic');
    return 'generic';
  }

  // Direct mapping for most guide types
  const DIAGNOSIS_MAP: Record<string, string> = {
    'facet_arthropathy': 'facet_arthropathy',
    'lumbar_instability': 'lumbar_instability',
    'muscular_nslbp': 'nonspecific_lbp', // Special mapping
    'sciatica': 'sciatica',
    'upper_lumbar_radiculopathy': 'upper_lumbar_radiculopathy',
    'si_joint_dysfunction': 'si_joint_dysfunction',
    'canal_stenosis': 'canal_stenosis',
    'central_disc_bulge': 'central_disc_bulge',
  };

  const diagnosisCode = DIAGNOSIS_MAP[guideType];

  if (!diagnosisCode) {
    console.info(`[Diagnosis] Unknown guide_type '${guideType}', using generic`);
    return 'generic';
  }

  console.info(`[Diagnosis] Mapped guide_type '${guideType}' to diagnosis_code '${diagnosisCode}'`);
  return diagnosisCode;
}

/**
 * Get all valid diagnosis codes
 * Used for validation and testing
 */
export function getValidDiagnosisCodes(): string[] {
  return [
    'facet_arthropathy',
    'lumbar_instability',
    'nonspecific_lbp',
    'sciatica',
    'upper_lumbar_radiculopathy',
    'si_joint_dysfunction',
    'canal_stenosis',
    'central_disc_bulge',
    'generic'
  ];
}