import { Questions } from '@/types/algorithm';

// Convert technical values to human-readable descriptions
export function interpretPainLocation(q1: string): string {
  const locations: Record<string, string> = {
    'back_only': 'lower back pain without leg symptoms',
    'back_one_leg': 'lower back pain radiating down one leg',
    'back_both_legs': 'lower back pain radiating down both legs',
    'groin_thigh': 'pain primarily in the groin or front of thigh'
  };
  return locations[q1] || 'lower back pain';
}

export function interpretPainTriggers(q2Responses: string[]): string[] {
  const triggers: Record<string, string> = {
    'bending_backward': 'Extending or arching your back',
    'getting_up': 'Transitional movements (sitting to standing)',
    'sitting_long': 'Prolonged sitting',
    'bending_forward': 'Forward bending',
    'standing_walking': 'Weight-bearing activities'
  };
  return q2Responses.map(trigger => triggers[trigger] || trigger);
}

export function interpretFunctionalTests(q10: string, q11: string, q12: string): {
  flexibility: string;
  spinalMobility: string;
  neurologicalSigns: string;
  implications: string[];
} {
  // Flexibility assessment (Q10 - toe touch)
  const flexibility = q10 === 'yes_easily' ? 'Good flexibility' :
                     q10 === 'yes_painful' ? 'Limited by pain' :
                     'Significantly restricted';

  // Spinal extension (Q11 - back arching)
  const spinalMobility = q11 === 'yes_easily' ? 'Normal extension' :
                         q11 === 'yes_painful' ? 'Painful extension' :
                         'Extension severely limited';

  // Neurological function (Q12 - heel/toe walking)
  const neurologicalSigns = q12 === 'yes_both' ? 'No neurological deficit' :
                           q12 === 'difficulty' ? 'Mild weakness present' :
                           'Significant weakness detected';

  // Clinical implications
  const implications: string[] = [];
  
  if (q10 === 'no') {
    implications.push('Hamstring tightness or nerve tension may be limiting forward bending');
  }
  if (q11 === 'no' || q11 === 'yes_painful') {
    implications.push('Extension limitation suggests possible facet joint or disc involvement');
  }
  if (q12 !== 'yes_both') {
    implications.push('Weakness pattern suggests possible nerve root involvement');
  }

  return { flexibility, spinalMobility, neurologicalSigns, implications };
}

export function generatePersonalizedExercises(responses: Record<string, any>): {
  recommended: string[];
  avoid: string[];
  modifications: string[];
} {
  const recommended: string[] = [];
  const avoid: string[] = [];
  const modifications: string[] = [];

  // Based on Q10 (toe touch ability)
  if (responses.Q10 === 'no') {
    recommended.push('Gentle hamstring stretches in supine position');
    recommended.push('Progressive neural mobilization exercises');
    avoid.push('Aggressive forward bending stretches');
  } else if (responses.Q10 === 'yes_easily') {
    recommended.push('Core stabilization exercises');
    recommended.push('Bird dog progressions');
  }

  // Based on Q11 (back extension)
  if (responses.Q11 === 'no' || responses.Q11 === 'yes_painful') {
    avoid.push('Cobra pose or prone press-ups initially');
    modifications.push('Start extension exercises in standing position');
    recommended.push('Gentle pelvic tilts');
  } else {
    recommended.push('Prone press-up progressions');
  }

  // Based on pain location (Q1)
  if (responses.Q1 === 'back_one_leg' || responses.Q1 === 'back_both_legs') {
    recommended.push('Sciatic nerve glides');
    recommended.push('Piriformis stretches');
    modifications.push('Avoid exercises that increase leg symptoms');
  }

  // Based on triggers (Q2)
  if (responses.Q2?.includes('sitting_long')) {
    recommended.push('Frequent position changes (every 30 minutes)');
    recommended.push('Lumbar support when sitting');
    modifications.push('Use standing desk for portions of the day');
  }

  // Based on weakness (Q12)
  if (responses.Q12 !== 'yes_both') {
    recommended.push('Ankle pumps and heel raises');
    recommended.push('Assisted toe walking exercises');
    modifications.push('Use wall or chair for balance during exercises');
  }

  return { recommended, avoid, modifications };
}

export function calculateSeverityScore(responses: Record<string, any>, painScore: number = 5): {
  score: number;
  interpretation: string;
  urgency: 'low' | 'moderate' | 'high' | 'urgent';
} {
  let severityPoints = 0;

  // Pain score contribution (0-10 scale → 0-30 points)
  severityPoints += painScore * 3;

  // Radiation pattern (Q1)
  if (responses.Q1 === 'back_both_legs') severityPoints += 15;
  else if (responses.Q1 === 'back_one_leg') severityPoints += 10;
  else if (responses.Q1 === 'groin_thigh') severityPoints += 8;

  // Below knee radiation (Q4)
  if (responses.Q4 === 'yes') severityPoints += 10;

  // Functional limitations (Q6)
  const q6Count = responses.Q6?.length || 0;
  severityPoints += q6Count * 5;

  // Movement restrictions (Q10-Q12)
  if (responses.Q10 === 'no') severityPoints += 10;
  if (responses.Q11 === 'no') severityPoints += 10;
  if (responses.Q12 === 'no') severityPoints += 15;
  if (responses.Q12 === 'difficulty') severityPoints += 8;

  // Red flags (Q13-Q16)
  if (responses.Q13 === 'yes' || responses.Q14 === 'yes') severityPoints += 50;
  if (responses.Q15 === 'yes' || responses.Q16 === 'yes') severityPoints += 30;

  // Calculate urgency
  let urgency: 'low' | 'moderate' | 'high' | 'urgent';
  let interpretation: string;

  if (responses.Q13 === 'yes' || responses.Q14 === 'yes') {
    urgency = 'urgent';
    interpretation = 'Immediate medical attention required - potential cauda equina syndrome';
  } else if (responses.Q15 === 'yes' || responses.Q16 === 'yes' || severityPoints >= 80) {
    urgency = 'high';
    interpretation = 'Prompt medical evaluation recommended within 24-48 hours';
  } else if (severityPoints >= 50) {
    urgency = 'moderate';
    interpretation = 'Medical consultation recommended within 1-2 weeks';
  } else {
    urgency = 'low';
    interpretation = 'Conservative management appropriate with monitoring';
  }

  return {
    score: Math.min(severityPoints, 100),
    interpretation,
    urgency
  };
}

export function getTimelineEstimate(responses: Record<string, any>, severity: { urgency: string }): {
  phase1: { duration: string; goals: string[] };
  phase2: { duration: string; goals: string[] };
  phase3: { duration: string; goals: string[] };
  warnings: string[];
} {
  const isAcute = responses.Q3 === 'morning';
  const hasNerveInvolvement = responses.Q1 !== 'back_only' || responses.Q4 === 'yes';
  
  if (severity.urgency === 'urgent' || severity.urgency === 'high') {
    return {
      phase1: {
        duration: 'Immediate medical care',
        goals: ['Obtain proper medical evaluation', 'Rule out serious pathology']
      },
      phase2: {
        duration: 'As directed by physician',
        goals: ['Follow medical treatment plan']
      },
      phase3: {
        duration: 'Ongoing',
        goals: ['Gradual return to activities as cleared']
      },
      warnings: ['Do not delay medical attention', 'Monitor for worsening symptoms']
    };
  }

  return {
    phase1: {
      duration: '1-2 weeks',
      goals: [
        'Pain reduction',
        'Gentle movement within comfort',
        'Establish daily walking routine',
        'Begin basic core activation'
      ]
    },
    phase2: {
      duration: '3-6 weeks',
      goals: [
        'Restore normal movement patterns',
        'Progressive strengthening',
        'Increase activity tolerance',
        hasNerveInvolvement ? 'Nerve mobility exercises' : 'Flexibility improvements'
      ]
    },
    phase3: {
      duration: '6-12 weeks',
      goals: [
        'Return to full activities',
        'Establish prevention program',
        'Build resilience',
        'Maintain fitness routine'
      ]
    },
    warnings: [
      'Progress should be gradual and pain-guided',
      'Seek medical care if symptoms worsen',
      'Temporary flare-ups are normal during recovery'
    ]
  };
}

export function getWorkplaceModifications(responses: Record<string, any>): string[] {
  const mods: string[] = [];

  // Based on triggers
  if (responses.Q2?.includes('sitting_long')) {
    mods.push('Use ergonomic chair with lumbar support');
    mods.push('Set timer for position changes every 30 minutes');
    mods.push('Consider sit-stand desk option');
  }

  if (responses.Q2?.includes('standing_walking')) {
    mods.push('Anti-fatigue mat for standing work');
    mods.push('Schedule regular sitting breaks');
    mods.push('Proper footwear with cushioning');
  }

  if (responses.Q2?.includes('bending_forward')) {
    mods.push('Raise work surface to reduce bending');
    mods.push('Use reaching tools for low items');
    mods.push('Practice hip hinge technique');
  }

  // Based on functional limitations
  if (responses.Q6?.includes('stairs')) {
    mods.push('Use elevator when available');
    mods.push('Take one step at a time with handrail');
  }

  if (responses.Q9?.includes('prolonged_standing')) {
    mods.push('Alternate standing on each foot');
    mods.push('Use footstool to prop one foot');
  }

  return mods;
}

export function getSleepPositionRecommendations(responses: Record<string, any>): {
  positions: string[];
  avoid: string[];
  tips: string[];
} {
  const positions: string[] = [];
  const avoid: string[] = [];
  const tips: string[] = [];

  // Based on pain pattern
  if (responses.Q1 === 'back_one_leg' || responses.Q1 === 'back_both_legs') {
    positions.push('Side-lying with pillow between knees');
    positions.push('Back sleeping with knees elevated on pillows');
    avoid.push('Stomach sleeping');
    tips.push('Keep spine in neutral alignment');
  }

  if (responses.Q8 === 'sitting_bending') {
    positions.push('Fetal position may provide relief');
    tips.push('Avoid sleeping in fully extended position');
  }

  if (responses.Q2?.includes('getting_up')) {
    tips.push('Roll to side before sitting up');
    tips.push('Use log roll technique to get out of bed');
  }

  // General recommendations
  tips.push('Use medium-firm mattress for optimal support');
  tips.push('Replace pillows if neck pain accompanies back pain');

  return { positions, avoid, tips };
}

// Helper to format question-answer pairs for disclosure
export function formatResponsesForDisclosure(responses: Record<string, any>): string[] {
  const disclosures: string[] = [];
  
  Object.entries(responses).forEach(([questionId, answer]) => {
    const question = Questions[questionId as keyof typeof Questions];
    if (!question) return;

    if (Array.isArray(answer)) {
      answer.forEach(a => {
        const option = question.options.find((opt: any) => opt.value === a);
        if (option) {
          disclosures.push(`You indicated: ${option.label.toLowerCase()}`);
        }
      });
    } else {
      const option = question.options.find((opt: any) => opt.value === answer);
      if (option) {
        disclosures.push(`You indicated: ${option.label.toLowerCase()}`);
      }
    }
  });

  return disclosures;
}

// Replace Bradley's placeholders with user-specific data
export function replacePlaceholders(content: string, responses: Record<string, any>): string {
  if (!content) return '';
  let result = content;
  
  // {{relievingFactors}} - What relieves pain (Q8)
  if (responses.Q8) {
    const relievingMap: Record<string, string> = {
      'sitting_bending': 'sitting or bending forward',
      'lying_down': 'lying down',
      'nothing': 'nothing in particular'
    };
    result = result.replace(/\{\{relievingFactors\}\}/g, 
      relievingMap[responses.Q8] || 'rest');
  }
  
  // {{numbLocation}} - Where numbness occurs (Q5 or Q6)
  let numbLocation = 'the affected areas';
  if (responses.Q6?.includes('numbness')) {
    // If they have numbness, use leg location from Q5
    if (responses.Q5) {
      const locationMap: Record<string, string> = {
        'buttock_back_thigh': 'your buttock and back of thigh',
        'groin_front_thigh': 'your groin and front of thigh',
        'side_thigh': 'the side of your thigh'
      };
      numbLocation = locationMap[responses.Q5] || 'your leg';
    } else if (responses.Q1 === 'back_both_legs') {
      numbLocation = 'both legs';
    } else if (responses.Q1 === 'back_one_leg') {
      numbLocation = 'one leg';
    }
  }
  result = result.replace(/\{\{numbLocation\}\}/g, numbLocation);
  
  // {{painLocation}} - Primary pain location (Q1)
  if (responses.Q1) {
    const painLocationMap: Record<string, string> = {
      'back_only': 'your lower back',
      'back_one_leg': 'your lower back and one leg',
      'back_both_legs': 'your lower back and both legs',
      'groin_thigh': 'your groin or front of thigh'
    };
    result = result.replace(/\{\{painLocation\}\}/g, 
      painLocationMap[responses.Q1] || 'the affected area');
  }
  
  // {{duration}} - How long symptoms present (not in our assessment, use default)
  result = result.replace(/\{\{duration\}\}/g, 'the past several weeks');
  
  // {{painTrigger}} - What makes pain worse (Q2)
  if (responses.Q2 && Array.isArray(responses.Q2) && responses.Q2.length > 0) {
    const triggers = interpretPainTriggers(responses.Q2);
    const triggerText = triggers.length > 1 
      ? triggers.slice(0, -1).join(', ') + ' and ' + triggers[triggers.length - 1]
      : triggers[0];
    result = result.replace(/\{\{painTrigger\}\}/g, triggerText.toLowerCase());
  }
  
  // {{mobilityImpact}} - Functional limitations (Q6 or Q9)
  let mobilityImpact = 'It affects your daily activities';
  if (responses.Q6?.includes('walking')) {
    mobilityImpact = 'It affects your ability to walk distances';
  } else if (responses.Q9?.includes('prolonged_standing')) {
    mobilityImpact = 'It affects your ability to stand for long periods';
  } else if (responses.Q9?.includes('getting_dressed')) {
    mobilityImpact = 'It affects your ability to perform daily tasks like getting dressed';
  }
  result = result.replace(/\{\{mobilityImpact\}\}/g, mobilityImpact);
  
  // {{painIntensity}} - Pain score
  if (responses.painScore !== undefined) {
    const intensity = responses.painScore >= 7 ? 'severe' : 
                     responses.painScore >= 4 ? 'moderate' : 'mild';
    result = result.replace(/\{\{painIntensity\}\}/g, `${responses.painScore}/10 (${intensity})`);
  }
  
  // {{radiationPattern}} - Where pain radiates (Q4, Q5)
  let radiationPattern = 'the affected area';
  if (responses.Q4 === 'yes') {
    radiationPattern = 'below your knee';
  } else if (responses.Q5) {
    const patterns: Record<string, string> = {
      'buttock_back_thigh': 'your buttock and back of thigh',
      'groin_front_thigh': 'your groin and front of thigh',
      'side_thigh': 'the side of your thigh'
    };
    radiationPattern = patterns[responses.Q5] || 'your leg';
  }
  result = result.replace(/\{\{radiationPattern\}\}/g, radiationPattern);
  
  // {{aggravatingFactors}} - What makes it worse (Q2)
  if (responses.Q2 && Array.isArray(responses.Q2)) {
    const factors = interpretPainTriggers(responses.Q2).join(', ');
    result = result.replace(/\{\{aggravatingFactors\}\}/g, factors.toLowerCase());
  }
  
  return result;
}