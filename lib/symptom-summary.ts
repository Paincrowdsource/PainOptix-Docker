/**
 * Maps raw assessment responses to natural-language symptom descriptions.
 * Used on the Pattern Recognized screen to echo back what the user reported
 * WITHOUT revealing the identified condition.
 */

const Q1_LABELS: Record<string, string> = {
  back_only: 'pain in your lower back',
  back_one_leg: 'lower back pain with leg involvement on one side',
  back_both_legs: 'lower back pain affecting both legs',
  groin_thigh: 'pain in your groin or front of thigh',
};

const Q2_LABELS: Record<string, string> = {
  bending_backward: 'pain when bending backward',
  getting_up: 'pain when getting up from sitting',
  sitting_long: 'discomfort with prolonged sitting',
  bending_forward: 'pain when bending forward',
  standing_walking: 'pain with standing or walking',
};

const Q3_LABELS: Record<string, string> = {
  morning: 'symptoms worse in the morning',
  end_of_day: 'symptoms worse at end of day',
  not_tied: 'symptoms not tied to time of day',
};

const Q4_LABELS: Record<string, string> = {
  yes: 'leg pain extending below the knee',
  no: 'leg pain staying above the knee',
};

const Q5_LABELS: Record<string, string> = {
  buttock_back_thigh: 'pain in the buttock and back of thigh',
  groin_front_thigh: 'pain in the groin and front of thigh',
  side_thigh: 'pain in the side of thigh',
};

const Q6_LABELS: Record<string, string> = {
  weakness: 'leg weakness',
  numbness: 'numbness or tingling',
  stairs: 'difficulty with stairs',
  walking: 'difficulty walking distances',
};

const Q7_LABELS: Record<string, string> = {
  worse_standing: 'symptoms worse with standing or walking',
  worse_sitting: 'symptoms worse with sitting',
  constant: 'fairly constant symptoms',
};

const Q8_LABELS: Record<string, string> = {
  sitting_bending: 'relief with sitting or bending forward',
  lying_down: 'relief when lying down',
  nothing: 'difficulty finding relief',
};

const Q9_LABELS: Record<string, string> = {
  getting_dressed: 'difficulty getting dressed',
  getting_in_car: 'difficulty getting in/out of a car',
  prolonged_standing: 'difficulty standing for long periods',
};

const SINGLE_SELECT: Record<string, Record<string, string>> = {
  Q1: Q1_LABELS,
  Q3: Q3_LABELS,
  Q4: Q4_LABELS,
  Q5: Q5_LABELS,
  Q7: Q7_LABELS,
  Q8: Q8_LABELS,
};

const MULTI_SELECT: Record<string, Record<string, string>> = {
  Q2: Q2_LABELS,
  Q6: Q6_LABELS,
  Q9: Q9_LABELS,
};

export function buildSymptomSummary(responses: Map<string, any>): string[] {
  const summaries: string[] = [];

  // Process single-select questions
  for (const [qId, labels] of Object.entries(SINGLE_SELECT)) {
    const answer = responses.get(qId);
    if (answer && labels[answer]) {
      summaries.push(labels[answer]);
    }
  }

  // Process multi-select questions (filter out 'none')
  for (const [qId, labels] of Object.entries(MULTI_SELECT)) {
    const answers = responses.get(qId);
    if (Array.isArray(answers)) {
      for (const val of answers) {
        if (val !== 'none' && labels[val]) {
          summaries.push(labels[val]);
        }
      }
    }
  }

  return summaries;
}
