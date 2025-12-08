import { EducationalGuide, QuestionResponse, AssessmentSession } from '@/types/algorithm';

// Diagnosis reasoning for AI audit trail
export interface DiagnosisReasoning {
  selectedGuide: EducationalGuide;
  primaryFactor: string;
  matchedRules: string[];
  timestamp: string;
  responses: { questionId: string; answer: any }[];
}

export class EducationalGuideSelector {
  private session: AssessmentSession;
  private reasoning: DiagnosisReasoning | null = null;

  constructor() {
    this.session = {
      sessionId: crypto.randomUUID(),
      responses: [],
      disclosures: []
    };
  }

  // Add a response and generate disclosure
  addResponse(questionId: string, question: string, answer: string | string[]): void {
    const disclosure = this.generateDisclosure(questionId, answer);
    
    this.session.responses.push({
      questionId,
      question,
      answer,
      disclosure
    });
    
    this.session.disclosures.push(disclosure);
  }

  // Generate user-friendly disclosure for FDA compliance
  private generateDisclosure(questionId: string, answer: string | string[]): string {
    const answerText = Array.isArray(answer) ? answer.join(', ') : answer;
    
    switch(questionId) {
      case 'Q1':
        return `You indicated your pain is located: ${answerText}`;
      case 'Q4':
        return answer === 'yes' 
          ? 'You indicated leg pain below the knee'
          : 'You indicated leg pain does not go below the knee';
      case 'Q5':
        return `You indicated leg pain goes to: ${answerText}`;
      case 'Q6':
        return `You indicated difficulty with: ${answerText}`;
      case 'Q13':
      case 'Q14':
      case 'Q15':
      case 'Q16':
        return answer === 'yes' 
          ? `You indicated YES to: ${questionId.replace('Q', 'Question ')}`
          : `You indicated NO to: ${questionId.replace('Q', 'Question ')}`;
      default:
        return `You indicated: ${answerText}`;
    }
  }

  // Main logic to select educational guide based on responses
  selectEducationalGuide(): EducationalGuide {
    const responses = this.getResponseMap();
    const matchedRules: string[] = [];
    let primaryFactor = '';
    let selectedGuide: EducationalGuide;

    // Check urgent symptoms first (Q13-Q16)
    if (this.checkUrgentSymptoms(responses)) {
      selectedGuide = 'urgent_symptoms';
      primaryFactor = 'Red flag symptoms detected';
      matchedRules.push('RULE: Q13-Q16 any YES → urgent_symptoms');
    } else {
      // Route based on Q1 (primary pain location)
      const q1Answer = responses.get('Q1');
      primaryFactor = `Pain location: ${q1Answer || 'unknown'}`;

      switch(q1Answer) {
        case 'back_only':
          selectedGuide = this.evaluateBackOnly(responses, matchedRules);
          break;
        case 'back_one_leg':
          selectedGuide = this.evaluateBackOneLeg(responses, matchedRules);
          break;
        case 'back_both_legs':
          selectedGuide = this.evaluateBackBothLegs(responses, matchedRules);
          break;
        case 'groin_thigh':
          selectedGuide = this.evaluateGroinThigh(responses, matchedRules);
          break;
        default:
          selectedGuide = 'muscular_nslbp';
          matchedRules.push('RULE: No pattern match → muscular_nslbp (default)');
      }
    }

    // Store reasoning for audit trail
    this.reasoning = {
      selectedGuide,
      primaryFactor,
      matchedRules,
      timestamp: new Date().toISOString(),
      responses: Array.from(responses.entries()).map(([questionId, answer]) => ({ questionId, answer }))
    };

    return selectedGuide;
  }

  // Check Q13-Q16 for urgent symptoms
  private checkUrgentSymptoms(responses: Map<string, any>): boolean {
    return responses.get('Q13') === 'yes' ||
           responses.get('Q14') === 'yes' ||
           responses.get('Q15') === 'yes' ||
           responses.get('Q16') === 'yes';
  }

  // Logic for back pain only (Q2-Q3)
  private evaluateBackOnly(responses: Map<string, any>, matchedRules: string[]): EducationalGuide {
    const q2Answers = responses.get('Q2') || [];

    if (q2Answers.includes('bending_backward')) {
      matchedRules.push('RULE: Q2 includes bending_backward → facet_arthropathy');
      return 'facet_arthropathy';
    }
    if (q2Answers.includes('getting_up')) {
      matchedRules.push('RULE: Q2 includes getting_up → lumbar_instability');
      return 'lumbar_instability';
    }
    matchedRules.push('RULE: Back only, no specific pattern → muscular_nslbp');
    return 'muscular_nslbp';
  }

  // Logic for back + one leg (Q4-Q6)
  private evaluateBackOneLeg(responses: Map<string, any>, matchedRules: string[]): EducationalGuide {
    if (responses.get('Q4') === 'yes') {
      matchedRules.push('RULE: Q4 = yes (leg pain below knee) → sciatica');
      return 'sciatica';
    }

    const q6Answers = responses.get('Q6') || [];
    if (q6Answers.length > 0) {
      matchedRules.push(`RULE: Q6 has symptoms (${q6Answers.join(', ')}) → upper_lumbar_radiculopathy`);
      return 'upper_lumbar_radiculopathy';
    }

    const q5Answer = responses.get('Q5');
    if (q5Answer === 'groin_front_thigh') {
      matchedRules.push('RULE: Q5 = groin_front_thigh → si_joint_dysfunction');
      return 'si_joint_dysfunction';
    }

    matchedRules.push('RULE: Back + one leg, no specific pattern → muscular_nslbp');
    return 'muscular_nslbp';
  }

  // Logic for back + both legs (Q7-Q8)
  private evaluateBackBothLegs(responses: Map<string, any>, matchedRules: string[]): EducationalGuide {
    const q7Answer = responses.get('Q7');
    const q8Answer = responses.get('Q8');

    if (q7Answer === 'worse_standing' && q8Answer === 'sitting_bending') {
      matchedRules.push('RULE: Q7 = worse_standing AND Q8 = sitting_bending → canal_stenosis');
      return 'canal_stenosis';
    }

    if (q7Answer === 'constant' || q7Answer === 'worse_sitting') {
      matchedRules.push(`RULE: Q7 = ${q7Answer} → central_disc_bulge`);
      return 'central_disc_bulge';
    }

    matchedRules.push('RULE: Back + both legs, no specific pattern → muscular_nslbp');
    return 'muscular_nslbp';
  }

  // Logic for groin/thigh pain (Q9)
  private evaluateGroinThigh(responses: Map<string, any>, matchedRules: string[]): EducationalGuide {
    const q9Answers = responses.get('Q9') || [];

    if (q9Answers.length > 0) {
      matchedRules.push(`RULE: Q9 has symptoms (${q9Answers.join(', ')}) → upper_lumbar_radiculopathy`);
      return 'upper_lumbar_radiculopathy';
    }

    matchedRules.push('RULE: Groin/thigh pain, no neurological symptoms → si_joint_dysfunction');
    return 'si_joint_dysfunction';
  }
  
  private getResponseMap(): Map<string, any> {
    const map = new Map();
    this.session.responses.forEach(r => {
      map.set(r.questionId, r.answer);
    });
    return map;
  }

  getSession(): AssessmentSession {
    return this.session;
  }

  getReasoning(): DiagnosisReasoning | null {
    return this.reasoning;
  }
}