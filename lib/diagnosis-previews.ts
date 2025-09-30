import { EducationalGuide } from '@/types/algorithm';

/**
 * Diagnosis Preview Content
 *
 * This file contains user-friendly symptoms and actionable tips for each diagnosis type.
 * Used in the BasicResultsScreen component to show immediate value before contact collection.
 *
 * Content extracted from free-tier guides in content/guides/free/
 */

export interface DiagnosisPreview {
  name: EducationalGuide;
  displayName: string;
  symptoms: string[];
  tips: string[];
}

export const diagnosisPreviews: Record<EducationalGuide, DiagnosisPreview> = {
  facet_arthropathy: {
    name: 'facet_arthropathy',
    displayName: 'Facet Arthropathy',
    symptoms: [
      'Pain worse with bending backward or arching',
      'Morning stiffness that improves with movement',
      'Relief when sitting or bending forward'
    ],
    tips: [
      'Apply heat for 15-20 minutes before activity',
      'Try gentle forward bending stretches',
      'Avoid prolonged standing or backward bending'
    ]
  },

  sciatica: {
    name: 'sciatica',
    displayName: 'Sciatica',
    symptoms: [
      'Sharp pain radiating down the leg below the knee',
      'Pain worse with sitting, coughing, or sneezing',
      'Numbness or tingling in the leg or foot'
    ],
    tips: [
      'Lie down to reduce nerve pressure',
      'Try gentle walking when tolerable',
      'Change positions frequently to avoid stiffness'
    ]
  },

  muscular_nslbp: {
    name: 'muscular_nslbp',
    displayName: 'Muscular Low Back Pain',
    symptoms: [
      'Pain worse with prolonged sitting or bending forward',
      'Pain may spread to buttock or outer thigh (not past knee)',
      'Feels sore or stiff without specific triggers'
    ],
    tips: [
      'Use gentle movement to reduce stiffness',
      'Change positions every 20-30 minutes',
      'Rest when needed, but avoid prolonged inactivity'
    ]
  },

  canal_stenosis: {
    name: 'canal_stenosis',
    displayName: 'Spinal Canal Stenosis',
    symptoms: [
      'Pain or numbness in both legs when standing or walking',
      'Symptoms improve with sitting or bending forward',
      'Leg weakness or heaviness during walking'
    ],
    tips: [
      'Sit down when symptoms worsen',
      'Lean forward (like on a shopping cart) when walking',
      'Lie down to relieve pressure on nerves'
    ]
  },

  central_disc_bulge: {
    name: 'central_disc_bulge',
    displayName: 'Central Disc Bulge',
    symptoms: [
      'Constant pain in lower back and both legs',
      'Pain worse with sitting or bending forward',
      'Numbness or tingling in both legs'
    ],
    tips: [
      'Lie flat to reduce disc pressure',
      'Avoid prolonged sitting',
      'Try gentle position changes throughout the day'
    ]
  },

  lumbar_instability: {
    name: 'lumbar_instability',
    displayName: 'Lumbar Instability',
    symptoms: [
      'Pain worse when getting up from sitting or rolling over',
      'Pain feels like a "catch" or instability',
      'Morning stiffness that improves with light activity'
    ],
    tips: [
      'Focus on core strengthening exercises',
      'Avoid sudden twisting or bending movements',
      'Lie flat when pain worsens'
    ]
  },

  upper_lumbar_radiculopathy: {
    name: 'upper_lumbar_radiculopathy',
    displayName: 'Upper Lumbar Nerve Pain',
    symptoms: [
      'Pain in groin or front/side of thigh',
      'Difficulty lifting knee or straightening leg',
      'Weakness climbing stairs or standing from low seat'
    ],
    tips: [
      'Rest and avoid movements that increase pain',
      'Change positions to reduce nerve irritation',
      'Use supportive seating with good posture'
    ]
  },

  si_joint_dysfunction: {
    name: 'si_joint_dysfunction',
    displayName: 'SI Joint Dysfunction',
    symptoms: [
      'One-sided pain in lower back, groin, or thigh',
      'Pain worse with prolonged sitting or twisting',
      'No significant weakness or numbness'
    ],
    tips: [
      'Change positions frequently',
      'Lie down when pain increases',
      'Try gentle stretching and movement'
    ]
  },

  urgent_symptoms: {
    name: 'urgent_symptoms',
    displayName: 'Urgent Symptoms Requiring Medical Attention',
    symptoms: [
      'Difficulty controlling bladder or bowel function',
      'Numbness in groin, inner thighs, or saddle area',
      'New or worsening leg weakness, fever, or unexplained weight loss'
    ],
    tips: [
      'Seek medical attention immediately',
      'These symptoms may require urgent evaluation',
      'Contact your doctor or visit an emergency room'
    ]
  }
};

/**
 * Get diagnosis preview by guide type
 */
export function getDiagnosisPreview(guideType: EducationalGuide): DiagnosisPreview {
  return diagnosisPreviews[guideType];
}

/**
 * Get user-friendly display name for a diagnosis
 */
export function getDisplayName(guideType: EducationalGuide): string {
  return diagnosisPreviews[guideType].displayName;
}