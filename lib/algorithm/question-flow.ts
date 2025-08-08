import { Questions } from '@/types/algorithm';

export class QuestionFlow {
  private currentPath: string[] = [];
  
  // Get next question based on previous answers
  getNextQuestion(previousResponses: Map<string, any>): string | null {
    // Start with Q1
    if (previousResponses.size === 0) {
      return 'Q1';
    }
    
    // Route based on Q1 answer
    const q1Answer = previousResponses.get('Q1');
    
    if (!q1Answer) return null;
    
    switch(q1Answer) {
      case 'back_only':
        return this.getBackOnlyNext(previousResponses);
      case 'back_one_leg':
        return this.getBackOneLegNext(previousResponses);
      case 'back_both_legs':
        return this.getBackBothLegsNext(previousResponses);
      case 'groin_thigh':
        return this.getGroinThighNext(previousResponses);
    }
    
    // All paths lead to functional tests (Q10-Q12) then urgent screening (Q13-Q16)
    return this.getCommonNext(previousResponses);
  }
  
  private getBackOnlyNext(responses: Map<string, any>): string | null {
    if (!responses.has('Q2')) return 'Q2';
    if (!responses.has('Q3')) return 'Q3';
    return this.getCommonNext(responses);
  }
  
  private getBackOneLegNext(responses: Map<string, any>): string | null {
    if (!responses.has('Q4')) return 'Q4';
    
    // If Q4 = Yes, skip to common questions
    if (responses.get('Q4') === 'yes') {
      return this.getCommonNext(responses);
    }
    
    if (!responses.has('Q5')) return 'Q5';
    if (!responses.has('Q6')) return 'Q6';
    return this.getCommonNext(responses);
  }
  
  private getBackBothLegsNext(responses: Map<string, any>): string | null {
    if (!responses.has('Q7')) return 'Q7';
    if (!responses.has('Q8')) return 'Q8';
    return this.getCommonNext(responses);
  }
  
  private getGroinThighNext(responses: Map<string, any>): string | null {
    if (!responses.has('Q9')) return 'Q9';
    return this.getCommonNext(responses);
  }
  
  private getCommonNext(responses: Map<string, any>): string | null {
    // Functional tests
    if (!responses.has('Q10')) return 'Q10';
    if (!responses.has('Q11')) return 'Q11';
    if (!responses.has('Q12')) return 'Q12';
    
    // Urgent symptoms
    if (!responses.has('Q13')) return 'Q13';
    if (!responses.has('Q14')) return 'Q14';
    if (!responses.has('Q15')) return 'Q15';
    if (!responses.has('Q16')) return 'Q16';
    
    // All questions answered
    return null;
  }
  
  // Get the progress percentage
  getProgress(responses: Map<string, any>): number {
    const totalNeeded = this.getTotalQuestionsNeeded(responses);
    const answered = responses.size;
    return Math.round((answered / totalNeeded) * 100);
  }
  
  // Calculate total questions needed based on path
  private getTotalQuestionsNeeded(responses: Map<string, any>): number {
    const q1Answer = responses.get('Q1');
    const baseQuestions = 7; // Q1 + Q10-16
    
    switch(q1Answer) {
      case 'back_only':
        return baseQuestions + 2; // +Q2-3
      case 'back_one_leg':
        const q4Answer = responses.get('Q4');
        return q4Answer === 'yes' ? baseQuestions + 1 : baseQuestions + 3; // +Q4 or +Q4-6
      case 'back_both_legs':
        return baseQuestions + 2; // +Q7-8
      case 'groin_thigh':
        return baseQuestions + 1; // +Q9
      default:
        return 16; // Default to all questions
    }
  }
}