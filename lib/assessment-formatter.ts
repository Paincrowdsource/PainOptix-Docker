// Utility functions for formatting assessment data into human-readable text

export const formatAssessmentValue = (questionId: string, value: string | string[]): string => {
  // Handle array values (multiple selection questions)
  if (Array.isArray(value)) {
    return value.map(v => formatSingleValue(v)).join(', ');
  }
  
  // Handle comma-separated values
  if (typeof value === 'string' && value.includes(',')) {
    return value.split(',').map(v => formatSingleValue(v.trim())).join(', ');
  }
  
  return formatSingleValue(value);
};

const formatSingleValue = (value: string): string => {
  const valueMappings: Record<string, string> = {
    // Location mappings (Q1)
    'back_only': 'Back only (no leg symptoms)',
    'back_one_leg': 'Lower back plus one leg',
    'back_both_legs': 'Lower back plus both legs',
    'back_left_thigh': 'Back radiating to left thigh',
    'back_right_thigh': 'Back radiating to right thigh',
    'groin_thigh': 'Groin or front of thigh',
    
    // Activity mappings (Q2)
    'bending_backward': 'Bending backward',
    'getting_up': 'Getting up from sitting',
    'sitting_long': 'Sitting for too long',
    'bending_forward': 'Bending forward',
    'standing_walking': 'Standing or walking',
    
    // Timing mappings (Q3)
    'morning': 'Morning after resting',
    'end_of_day': 'End of day after activity',
    'not_tied': 'Not tied to time of day',
    
    // Yes/No mappings (Q4, Q13-Q16)
    'yes': 'Yes',
    'no': 'No',
    
    // Leg pain location (Q5)
    'buttock_back_thigh': 'Buttock and back of thigh',
    'groin_front_thigh': 'Groin and front of thigh',
    'side_thigh': 'Side of thigh',
    
    // Difficulties (Q6, Q9)
    'weakness': 'Weakness in leg',
    'numbness': 'Numbness or tingling',
    'stairs': 'Going up/down stairs',
    'walking': 'Walking distances',
    'getting_dressed': 'Getting dressed',
    'getting_in_car': 'Getting in/out of car',
    'prolonged_standing': 'Standing for long periods',
    'none': 'None of these',
    
    // Pain behavior (Q7)
    'worse_standing': 'Worse with standing/walking',
    'worse_sitting': 'Worse with sitting',
    'constant': 'Pretty constant',
    
    // What helps (Q8)
    'sitting_bending': 'Sitting or bending forward',
    'lying_down': 'Lying down',
    'nothing': 'Nothing really helps',
    
    // Physical abilities (Q10-Q12)
    'yes_easily': 'Yes, easily',
    'yes_painful': 'Yes, but it\'s painful',
    'yes_both': 'Yes, both heels and toes',
    'difficulty': 'With some difficulty',
    'no_painful': 'No, too painful or stiff',
    
    // Generic mappings
    'standing': 'Standing',
    'sitting': 'Sitting',
    'lying': 'Lying down'
  };
  
  return valueMappings[value] || value;
};

export const getQuestionText = (questionId: string): string => {
  const questionTexts: Record<string, string> = {
    'Q1': 'Pain location',
    'Q2': 'Activities that worsen pain',
    'Q3': 'When pain is worse',
    'Q4': 'Does pain go below knee',
    'Q5': 'Where leg pain goes',
    'Q6': 'Current difficulties',
    'Q7': 'How pain behaves',
    'Q8': 'What helps the pain',
    'Q9': 'Activity limitations',
    'Q10': 'Can bend forward and touch toes',
    'Q11': 'Can arch back backward',
    'Q12': 'Can walk on heels and toes',
    'Q13': 'Bladder/bowel control',
    'Q14': 'Groin/genital numbness',
    'Q15': 'Recent weight loss',
    'Q16': 'History of cancer',
    // Add any other question IDs as needed
  };
  
  return questionTexts[questionId] || questionId;
};

export const formatAssessmentResponses = (responses: any[]): Array<{
  question: string;
  answer: string;
  icon?: string;
}> => {
  if (!responses || !Array.isArray(responses)) return [];
  
  return responses.map(response => {
    const questionText = response.question || getQuestionText(response.questionId);
    const formattedAnswer = formatAssessmentValue(response.questionId, response.answer);
    
    // Add icons based on question category
    let icon = 'info';
    if (response.questionId === 'Q1' || response.questionId === 'Q5') icon = 'location';
    if (response.questionId === 'Q2' || response.questionId === 'Q6' || response.questionId === 'Q9') icon = 'activity';
    if (response.questionId === 'Q3' || response.questionId === 'Q7') icon = 'clock';
    if (response.questionId === 'Q13' || response.questionId === 'Q14' || response.questionId === 'Q15' || response.questionId === 'Q16') icon = 'alert';
    
    return {
      question: questionText,
      answer: formattedAnswer,
      icon
    };
  });
};