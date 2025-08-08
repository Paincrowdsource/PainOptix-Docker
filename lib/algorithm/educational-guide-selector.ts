import { EducationalGuide, QuestionResponse, AssessmentSession } from '@/types/algorithm';

export class EducationalGuideSelector {
  private session: AssessmentSession;
  
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
    
    // Check urgent symptoms first (Q13-Q16)
    if (this.checkUrgentSymptoms(responses)) {
      return 'urgent_symptoms';
    }
    
    // Route based on Q1 (primary pain location)
    const q1Answer = responses.get('Q1');
    
    switch(q1Answer) {
      case 'back_only':
        return this.evaluateBackOnly(responses);
      case 'back_one_leg':
        return this.evaluateBackOneLeg(responses);
      case 'back_both_legs':
        return this.evaluateBackBothLegs(responses);
      case 'groin_thigh':
        return this.evaluateGroinThigh(responses);
      default:
        return 'muscular_nslbp'; // Default
    }
  }

  // Check Q13-Q16 for urgent symptoms
  private checkUrgentSymptoms(responses: Map<string, any>): boolean {
    return responses.get('Q13') === 'yes' ||
           responses.get('Q14') === 'yes' ||
           responses.get('Q15') === 'yes' ||
           responses.get('Q16') === 'yes';
  }

  // Logic for back pain only (Q2-Q3)
  private evaluateBackOnly(responses: Map<string, any>): EducationalGuide {
    const q2Answers = responses.get('Q2') || [];
    const q3Answer = responses.get('Q3');
    
    if (q2Answers.includes('bending_backward')) {
      return 'facet_arthropathy';
    }
    if (q2Answers.includes('getting_up')) {
      return 'lumbar_instability';
    }
    return 'muscular_nslbp';
  }

  // Logic for back + one leg (Q4-Q6)
  private evaluateBackOneLeg(responses: Map<string, any>): EducationalGuide {
    if (responses.get('Q4') === 'yes') {
      return 'sciatica';
    }
    
    const q6Answers = responses.get('Q6') || [];
    if (q6Answers.length > 0) {
      return 'upper_lumbar_radiculopathy';
    }
    
    const q5Answer = responses.get('Q5');
    if (q5Answer === 'groin_front_thigh') {
      return 'si_joint_dysfunction';
    }
    
    return 'muscular_nslbp';
  }

  // Logic for back + both legs (Q7-Q8)
  private evaluateBackBothLegs(responses: Map<string, any>): EducationalGuide {
    const q7Answer = responses.get('Q7');
    const q8Answer = responses.get('Q8');
    
    if (q7Answer === 'worse_standing' && q8Answer === 'sitting_bending') {
      return 'canal_stenosis';
    }
    
    if (q7Answer === 'constant' || q7Answer === 'worse_sitting') {
      return 'central_disc_bulge';
    }
    
    return 'muscular_nslbp';
  }

  // Logic for groin/thigh pain (Q9)
  private evaluateGroinThigh(responses: Map<string, any>): EducationalGuide {
    const q9Answers = responses.get('Q9') || [];
    
    if (q9Answers.length > 0) {
      return 'upper_lumbar_radiculopathy';
    }
    
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
}