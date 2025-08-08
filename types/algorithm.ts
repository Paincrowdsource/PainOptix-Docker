// FDA-compliant Educational Guide types (NOT diagnoses)
export type EducationalGuide = 
  | 'sciatica'
  | 'upper_lumbar_radiculopathy'
  | 'si_joint_dysfunction'
  | 'canal_stenosis'
  | 'central_disc_bulge'
  | 'facet_arthropathy'
  | 'muscular_nslbp'
  | 'lumbar_instability'
  | 'urgent_symptoms';

export type QuestionResponse = {
  questionId: string;
  question: string;
  answer: string | string[];
  disclosure: string;
};

export type AssessmentSession = {
  sessionId: string;
  responses: QuestionResponse[];
  disclosures: string[];
  selectedGuide?: EducationalGuide;
};

// Question definitions
export const Questions = {
  Q1: {
    id: 'Q1',
    text: 'Where is your pain located most of the time?',
    type: 'single',
    options: [
      { value: 'back_only', label: 'Just my lower back (no leg symptoms)' },
      { value: 'back_one_leg', label: 'Lower back plus one leg (left or right)' },
      { value: 'back_both_legs', label: 'Lower back plus both legs' },
      { value: 'groin_thigh', label: 'Mostly in my groin or front of my thigh' }
    ]
  },
  Q2: {
    id: 'Q2',
    text: 'What makes your back pain worse? (Check all that apply)',
    type: 'multiple',
    options: [
      { value: 'bending_backward', label: 'Bending backward or arching my back' },
      { value: 'getting_up', label: 'Getting up from sitting or rolling over in bed' },
      { value: 'sitting_long', label: 'Sitting for too long' },
      { value: 'bending_forward', label: 'Bending forward' },
      { value: 'standing_walking', label: 'Standing or walking for a while' }
    ]
  },
  Q3: {
    id: 'Q3',
    text: 'When is your pain usually worse?',
    type: 'single',
    options: [
      { value: 'morning', label: 'Morning after resting' },
      { value: 'end_of_day', label: 'End of day after activity' },
      { value: 'not_tied', label: 'Not tied to time of day' }
    ]
  },
  Q4: {
    id: 'Q4',
    text: 'Does your leg pain go below your knee?',
    type: 'single',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' }
    ]
  },
  Q5: {
    id: 'Q5',
    text: 'Where does your leg pain mostly go?',
    type: 'single',
    options: [
      { value: 'buttock_back_thigh', label: 'Buttock and back of thigh' },
      { value: 'groin_front_thigh', label: 'Groin and front of thigh' },
      { value: 'side_thigh', label: 'Side of thigh' }
    ]
  },
  Q6: {
    id: 'Q6',
    text: 'Are you having any difficulty with the following? (Check all that apply)',
    type: 'multiple',
    options: [
      { value: 'weakness', label: 'Weakness in leg' },
      { value: 'numbness', label: 'Numbness or tingling' },
      { value: 'stairs', label: 'Going up/down stairs' },
      { value: 'walking', label: 'Walking distances' },
      { value: 'none', label: 'None of these' }
    ]
  },
  Q7: {
    id: 'Q7',
    text: 'How does your pain behave?',
    type: 'single',
    options: [
      { value: 'worse_standing', label: 'Worse with standing/walking' },
      { value: 'worse_sitting', label: 'Worse with sitting' },
      { value: 'constant', label: 'Pretty constant' }
    ]
  },
  Q8: {
    id: 'Q8',
    text: 'What helps your pain?',
    type: 'single',
    options: [
      { value: 'sitting_bending', label: 'Sitting or bending forward' },
      { value: 'lying_down', label: 'Lying down' },
      { value: 'nothing', label: 'Nothing really helps' }
    ]
  },
  Q9: {
    id: 'Q9',
    text: 'Are you having difficulty with any of these activities?',
    type: 'multiple',
    options: [
      { value: 'getting_dressed', label: 'Getting dressed' },
      { value: 'getting_in_car', label: 'Getting in/out of car' },
      { value: 'prolonged_standing', label: 'Standing for long periods' },
      { value: 'none', label: 'None of these' }
    ]
  },
  Q10: {
    id: 'Q10',
    text: 'Can you bend forward and touch your toes?',
    type: 'single',
    options: [
      { value: 'yes_easily', label: 'Yes, easily' },
      { value: 'yes_painful', label: 'Yes, but it\'s painful' },
      { value: 'no', label: 'No, can\'t reach' }
    ]
  },
  Q11: {
    id: 'Q11',
    text: 'Can you arch your back backward?',
    type: 'single',
    options: [
      { value: 'yes_easily', label: 'Yes, easily' },
      { value: 'yes_painful', label: 'Yes, but it\'s painful' },
      { value: 'no', label: 'No, too painful or stiff' }
    ]
  },
  Q12: {
    id: 'Q12',
    text: 'Can you walk on your heels and toes?',
    type: 'single',
    options: [
      { value: 'yes_both', label: 'Yes, both heels and toes' },
      { value: 'difficulty', label: 'With some difficulty' },
      { value: 'no', label: 'No, too weak or painful' }
    ]
  },
  Q13: {
    id: 'Q13',
    text: 'Have you lost control of your bladder or bowels?',
    type: 'single',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' }
    ]
  },
  Q14: {
    id: 'Q14',
    text: 'Do you have numbness in your groin or genital area?',
    type: 'single',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' }
    ]
  },
  Q15: {
    id: 'Q15',
    text: 'Have you had unexplained weight loss recently?',
    type: 'single',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' }
    ]
  },
  Q16: {
    id: 'Q16',
    text: 'Do you have a history of cancer?',
    type: 'single',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' }
    ]
  }
};