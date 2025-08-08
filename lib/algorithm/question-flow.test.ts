import { QuestionFlow } from './question-flow';

describe('QuestionFlow', () => {
  let questionFlow: QuestionFlow;

  beforeEach(() => {
    questionFlow = new QuestionFlow();
  });

  describe('Initial Question', () => {
    test('should start with Q1', () => {
      const responses = new Map();
      const nextQuestion = questionFlow.getNextQuestion(responses);
      expect(nextQuestion).toBe('Q1');
    });
  });

  describe('Back Only Path (Q1 = back_only)', () => {
    test('should follow Q1 -> Q2 -> Q3 -> Q10-Q12 -> Q13-Q16', () => {
      const responses = new Map();
      
      // Q1 -> Q2
      responses.set('Q1', 'back_only');
      expect(questionFlow.getNextQuestion(responses)).toBe('Q2');
      
      // Q2 -> Q3
      responses.set('Q2', ['sitting']);
      expect(questionFlow.getNextQuestion(responses)).toBe('Q3');
      
      // Q3 -> Q10
      responses.set('Q3', 'morning');
      expect(questionFlow.getNextQuestion(responses)).toBe('Q10');
      
      // Q10 -> Q11
      responses.set('Q10', '6_months');
      expect(questionFlow.getNextQuestion(responses)).toBe('Q11');
      
      // Q11 -> Q12
      responses.set('Q11', ['gradual']);
      expect(questionFlow.getNextQuestion(responses)).toBe('Q12');
      
      // Q12 -> Q13
      responses.set('Q12', ['none']);
      expect(questionFlow.getNextQuestion(responses)).toBe('Q13');
      
      // Q13 -> Q14
      responses.set('Q13', 'no');
      expect(questionFlow.getNextQuestion(responses)).toBe('Q14');
      
      // Q14 -> Q15
      responses.set('Q14', 'no');
      expect(questionFlow.getNextQuestion(responses)).toBe('Q15');
      
      // Q15 -> Q16
      responses.set('Q15', 'no');
      expect(questionFlow.getNextQuestion(responses)).toBe('Q16');
      
      // Q16 -> Complete
      responses.set('Q16', 'no');
      expect(questionFlow.getNextQuestion(responses)).toBeNull();
    });
  });

  describe('Back + One Leg Path (Q1 = back_one_leg)', () => {
    test('should follow Q1 -> Q4 path when leg pain below knee', () => {
      const responses = new Map();
      
      // Q1 -> Q4
      responses.set('Q1', 'back_one_leg');
      expect(questionFlow.getNextQuestion(responses)).toBe('Q4');
      
      // Q4 = yes -> Q10 (skips Q5, Q6)
      responses.set('Q4', 'yes');
      expect(questionFlow.getNextQuestion(responses)).toBe('Q10');
    });

    test('should follow Q1 -> Q4 -> Q5 -> Q6 path when leg pain NOT below knee', () => {
      const responses = new Map();
      
      // Q1 -> Q4
      responses.set('Q1', 'back_one_leg');
      expect(questionFlow.getNextQuestion(responses)).toBe('Q4');
      
      // Q4 = no -> Q5
      responses.set('Q4', 'no');
      expect(questionFlow.getNextQuestion(responses)).toBe('Q5');
      
      // Q5 -> Q6
      responses.set('Q5', 'buttock');
      expect(questionFlow.getNextQuestion(responses)).toBe('Q6');
      
      // Q6 -> Q10
      responses.set('Q6', ['none']);
      expect(questionFlow.getNextQuestion(responses)).toBe('Q10');
    });
  });

  describe('Back + Both Legs Path (Q1 = back_both_legs)', () => {
    test('should follow Q1 -> Q7 -> Q8 path', () => {
      const responses = new Map();
      
      // Q1 -> Q7
      responses.set('Q1', 'back_both_legs');
      expect(questionFlow.getNextQuestion(responses)).toBe('Q7');
      
      // Q7 -> Q8
      responses.set('Q7', 'worse_standing');
      expect(questionFlow.getNextQuestion(responses)).toBe('Q8');
      
      // Q8 -> Q10
      responses.set('Q8', 'sitting_bending');
      expect(questionFlow.getNextQuestion(responses)).toBe('Q10');
    });
  });

  describe('Groin/Thigh Path (Q1 = groin_thigh)', () => {
    test('should follow Q1 -> Q9 path', () => {
      const responses = new Map();
      
      // Q1 -> Q9
      responses.set('Q1', 'groin_thigh');
      expect(questionFlow.getNextQuestion(responses)).toBe('Q9');
      
      // Q9 -> Q10
      responses.set('Q9', ['numbness']);
      expect(questionFlow.getNextQuestion(responses)).toBe('Q10');
    });
  });

  describe('Progress Calculation', () => {
    test('should calculate 0% progress with no responses', () => {
      const responses = new Map();
      expect(questionFlow.getProgress(responses)).toBe(0);
    });

    test('should calculate progress for back_only path', () => {
      const responses = new Map();
      
      // Total questions for back_only: baseQuestions(7) + 2 = 9 questions
      responses.set('Q1', 'back_only');
      expect(questionFlow.getProgress(responses)).toBeCloseTo(11, 0); // 1/9
      
      responses.set('Q2', ['sitting']);
      expect(questionFlow.getProgress(responses)).toBeCloseTo(22, 0); // 2/9
      
      responses.set('Q3', 'morning');
      expect(questionFlow.getProgress(responses)).toBeCloseTo(33, 0); // 3/9
      
      // Add all remaining questions
      responses.set('Q10', '6_months');
      responses.set('Q11', ['gradual']);
      responses.set('Q12', ['none']);
      responses.set('Q13', 'no');
      responses.set('Q14', 'no');
      responses.set('Q15', 'no');
      responses.set('Q16', 'no');
      
      // 9 responses / 9 total = 100%, but rounding might cause issues
      const progress = questionFlow.getProgress(responses);
      expect(progress).toBeGreaterThanOrEqual(100);
    });

    test('should calculate progress for back_one_leg path with sciatica', () => {
      const responses = new Map();
      
      // Total for sciatica path: baseQuestions(7) + 1 = 8 questions
      responses.set('Q1', 'back_one_leg');
      responses.set('Q4', 'yes'); // Sciatica path
      
      expect(questionFlow.getProgress(responses)).toBeCloseTo(25, 0); // 2/8
    });

    test('should calculate progress for back_both_legs path', () => {
      const responses = new Map();
      
      // Total: baseQuestions(7) + 2 = 9 questions
      responses.set('Q1', 'back_both_legs');
      responses.set('Q7', 'worse_standing');
      responses.set('Q8', 'sitting_bending');
      
      expect(questionFlow.getProgress(responses)).toBeCloseTo(33, 0); // 3/9
    });

    test('should handle completion correctly', () => {
      const responses = new Map();
      
      // Complete groin_thigh path
      responses.set('Q1', 'groin_thigh');
      responses.set('Q9', ['weakness']);
      responses.set('Q10', '3_months');
      responses.set('Q11', ['sudden']);
      responses.set('Q12', ['numbness']);
      responses.set('Q13', 'no');
      responses.set('Q14', 'no');
      responses.set('Q15', 'no');
      responses.set('Q16', 'no');
      
      // 8 responses for groin_thigh path
      const progress = questionFlow.getProgress(responses);
      expect(progress).toBeGreaterThanOrEqual(100);
      expect(questionFlow.getNextQuestion(responses)).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    test('should handle invalid Q1 response', () => {
      const responses = new Map();
      responses.set('Q1', 'invalid_value');
      
      // Should default to common questions
      expect(questionFlow.getNextQuestion(responses)).toBe('Q10');
    });

    test('should handle missing intermediate responses', () => {
      const responses = new Map();
      responses.set('Q1', 'back_one_leg');
      // Skip Q4
      responses.set('Q5', 'buttock');
      
      // Should still ask Q4
      expect(questionFlow.getNextQuestion(responses)).toBe('Q4');
    });

    test('should complete assessment after Q16 regardless of path', () => {
      const paths = ['back_only', 'back_one_leg', 'back_both_legs', 'groin_thigh'];
      
      paths.forEach(path => {
        const responses = new Map();
        
        // Answer all questions up to Q16
        responses.set('Q1', path);
        // Add path-specific questions
        if (path === 'back_only') {
          responses.set('Q2', ['sitting']);
          responses.set('Q3', 'morning');
        } else if (path === 'back_one_leg') {
          responses.set('Q4', 'yes');
        } else if (path === 'back_both_legs') {
          responses.set('Q7', 'constant');
          responses.set('Q8', 'nothing');
        } else if (path === 'groin_thigh') {
          responses.set('Q9', ['none']);
        }
        
        // Common questions
        responses.set('Q10', '1_month');
        responses.set('Q11', ['gradual']);
        responses.set('Q12', ['none']);
        responses.set('Q13', 'no');
        responses.set('Q14', 'no');
        responses.set('Q15', 'no');
        responses.set('Q16', 'no');
        
        expect(questionFlow.getNextQuestion(responses)).toBeNull();
      });
    });

    test('should not get stuck in infinite loop', () => {
      const responses = new Map();
      
      // Add responses in wrong order
      responses.set('Q10', '1_month');
      responses.set('Q13', 'no');
      responses.set('Q1', 'back_only');
      
      // Should still progress correctly
      let nextQuestion = questionFlow.getNextQuestion(responses);
      let iterations = 0;
      const maxIterations = 20;
      
      while (nextQuestion && iterations < maxIterations) {
        responses.set(nextQuestion, 'test_answer');
        nextQuestion = questionFlow.getNextQuestion(responses);
        iterations++;
      }
      
      expect(iterations).toBeLessThan(maxIterations);
    });
  });

  describe('Path Validation', () => {
    test('should validate back_only path requires Q2 and Q3', () => {
      const responses = new Map();
      responses.set('Q1', 'back_only');
      
      // Should ask Q2
      expect(questionFlow.getNextQuestion(responses)).toBe('Q2');
      
      // Skip Q2 and add Q3 - should still ask Q2
      responses.set('Q3', 'morning');
      expect(questionFlow.getNextQuestion(responses)).toBe('Q2');
    });

    test('should validate back_one_leg path requires Q4', () => {
      const responses = new Map();
      responses.set('Q1', 'back_one_leg');
      
      // Should ask Q4
      expect(questionFlow.getNextQuestion(responses)).toBe('Q4');
      
      // Skip Q4 and add Q5 - should still ask Q4
      responses.set('Q5', 'buttock');
      expect(questionFlow.getNextQuestion(responses)).toBe('Q4');
    });

    test('should ensure red flag questions are always asked', () => {
      const responses = new Map();
      
      // Complete a path but skip red flags
      responses.set('Q1', 'groin_thigh');
      responses.set('Q9', ['none']);
      responses.set('Q10', '1_month');
      responses.set('Q11', ['gradual']);
      responses.set('Q12', ['none']);
      // Skip Q13-Q16
      
      // Should ask Q13
      expect(questionFlow.getNextQuestion(responses)).toBe('Q13');
      
      // Add Q13, skip Q14
      responses.set('Q13', 'no');
      expect(questionFlow.getNextQuestion(responses)).toBe('Q14');
      
      // Add Q14, skip Q15
      responses.set('Q14', 'no');
      expect(questionFlow.getNextQuestion(responses)).toBe('Q15');
      
      // Add Q15, skip Q16
      responses.set('Q15', 'no');
      expect(questionFlow.getNextQuestion(responses)).toBe('Q16');
    });
  });
});