import { EducationalGuideSelector } from './educational-guide-selector';
import { EducationalGuide } from '@/types/algorithm';

describe('EducationalGuideSelector', () => {
  let selector: EducationalGuideSelector;

  beforeEach(() => {
    selector = new EducationalGuideSelector();
  });

  describe('Urgent Symptoms Detection', () => {
    test('should identify urgent symptoms when Q13 (bladder/bowel control) is yes', () => {
      selector.addResponse('Q1', 'Where is your pain?', 'back_only');
      selector.addResponse('Q13', 'Lost bladder/bowel control?', 'yes');
      
      const guide = selector.selectEducationalGuide();
      expect(guide).toBe('urgent_symptoms');
    });

    test('should identify urgent symptoms when Q14 (progressive weakness) is yes', () => {
      selector.addResponse('Q1', 'Where is your pain?', 'back_only');
      selector.addResponse('Q14', 'Progressive leg weakness?', 'yes');
      
      const guide = selector.selectEducationalGuide();
      expect(guide).toBe('urgent_symptoms');
    });

    test('should identify urgent symptoms when Q15 (numbness in groin) is yes', () => {
      selector.addResponse('Q1', 'Where is your pain?', 'back_only');
      selector.addResponse('Q15', 'Numbness in groin area?', 'yes');
      
      const guide = selector.selectEducationalGuide();
      expect(guide).toBe('urgent_symptoms');
    });

    test('should identify urgent symptoms when Q16 (severe unrelenting pain) is yes', () => {
      selector.addResponse('Q1', 'Where is your pain?', 'back_only');
      selector.addResponse('Q16', 'Severe unrelenting pain?', 'yes');
      
      const guide = selector.selectEducationalGuide();
      expect(guide).toBe('urgent_symptoms');
    });

    test('should prioritize urgent symptoms over other conditions', () => {
      // Even with classic sciatica pattern
      selector.addResponse('Q1', 'Where is your pain?', 'back_one_leg');
      selector.addResponse('Q4', 'Does leg pain go below knee?', 'yes');
      selector.addResponse('Q13', 'Lost bladder/bowel control?', 'yes'); // Red flag
      
      const guide = selector.selectEducationalGuide();
      expect(guide).toBe('urgent_symptoms');
    });
  });

  describe('Sciatica Pattern Recognition', () => {
    test('should identify classic sciatica pattern', () => {
      selector.addResponse('Q1', 'Where is your pain?', 'back_one_leg');
      selector.addResponse('Q4', 'Does leg pain go below knee?', 'yes');
      selector.addResponse('Q13', 'Lost bladder/bowel control?', 'no');
      selector.addResponse('Q14', 'Progressive leg weakness?', 'no');
      selector.addResponse('Q15', 'Numbness in groin area?', 'no');
      selector.addResponse('Q16', 'Severe unrelenting pain?', 'no');
      
      const guide = selector.selectEducationalGuide();
      expect(guide).toBe('sciatica');
    });

    test('should not identify sciatica when pain does not go below knee', () => {
      selector.addResponse('Q1', 'Where is your pain?', 'back_one_leg');
      selector.addResponse('Q4', 'Does leg pain go below knee?', 'no');
      selector.addResponse('Q6', 'Any difficulty?', ['none']);
      
      const guide = selector.selectEducationalGuide();
      expect(guide).not.toBe('sciatica');
    });
  });

  describe('Facet Arthropathy Pattern', () => {
    test('should identify facet arthropathy with backward bending pain', () => {
      selector.addResponse('Q1', 'Where is your pain?', 'back_only');
      selector.addResponse('Q2', 'What makes pain worse?', ['bending_backward']);
      selector.addResponse('Q13', 'Lost bladder/bowel control?', 'no');
      selector.addResponse('Q14', 'Progressive leg weakness?', 'no');
      selector.addResponse('Q15', 'Numbness in groin area?', 'no');
      selector.addResponse('Q16', 'Severe unrelenting pain?', 'no');
      
      const guide = selector.selectEducationalGuide();
      expect(guide).toBe('facet_arthropathy');
    });
  });

  describe('Lumbar Instability Pattern', () => {
    test('should identify lumbar instability with getting up difficulty', () => {
      selector.addResponse('Q1', 'Where is your pain?', 'back_only');
      selector.addResponse('Q2', 'What makes pain worse?', ['getting_up']);
      selector.addResponse('Q13', 'Lost bladder/bowel control?', 'no');
      selector.addResponse('Q14', 'Progressive leg weakness?', 'no');
      selector.addResponse('Q15', 'Numbness in groin area?', 'no');
      selector.addResponse('Q16', 'Severe unrelenting pain?', 'no');
      
      const guide = selector.selectEducationalGuide();
      expect(guide).toBe('lumbar_instability');
    });
  });

  describe('Upper Lumbar Radiculopathy Pattern', () => {
    test('should identify upper lumbar radiculopathy with neurological symptoms', () => {
      selector.addResponse('Q1', 'Where is your pain?', 'back_one_leg');
      selector.addResponse('Q4', 'Does leg pain go below knee?', 'no');
      selector.addResponse('Q6', 'Any difficulty?', ['weakness', 'numbness']);
      selector.addResponse('Q13', 'Lost bladder/bowel control?', 'no');
      selector.addResponse('Q14', 'Progressive leg weakness?', 'no');
      selector.addResponse('Q15', 'Numbness in groin area?', 'no');
      selector.addResponse('Q16', 'Severe unrelenting pain?', 'no');
      
      const guide = selector.selectEducationalGuide();
      expect(guide).toBe('upper_lumbar_radiculopathy');
    });

    test('should identify upper lumbar radiculopathy with groin/thigh pain and symptoms', () => {
      selector.addResponse('Q1', 'Where is your pain?', 'groin_thigh');
      selector.addResponse('Q9', 'Any difficulty with groin/thigh?', ['weakness']);
      selector.addResponse('Q13', 'Lost bladder/bowel control?', 'no');
      selector.addResponse('Q14', 'Progressive leg weakness?', 'no');
      selector.addResponse('Q15', 'Numbness in groin area?', 'no');
      selector.addResponse('Q16', 'Severe unrelenting pain?', 'no');
      
      const guide = selector.selectEducationalGuide();
      expect(guide).toBe('upper_lumbar_radiculopathy');
    });
  });

  describe('SI Joint Dysfunction Pattern', () => {
    test('should identify SI joint dysfunction with groin/front thigh pain', () => {
      selector.addResponse('Q1', 'Where is your pain?', 'back_one_leg');
      selector.addResponse('Q4', 'Does leg pain go below knee?', 'no');
      selector.addResponse('Q5', 'Where does leg pain go?', 'groin_front_thigh');
      selector.addResponse('Q6', 'Any difficulty?', []); // Empty array, no symptoms
      selector.addResponse('Q13', 'Lost bladder/bowel control?', 'no');
      selector.addResponse('Q14', 'Progressive leg weakness?', 'no');
      selector.addResponse('Q15', 'Numbness in groin area?', 'no');
      selector.addResponse('Q16', 'Severe unrelenting pain?', 'no');
      
      const guide = selector.selectEducationalGuide();
      expect(guide).toBe('si_joint_dysfunction');
    });

    test('should identify SI joint dysfunction with groin/thigh location and no symptoms', () => {
      selector.addResponse('Q1', 'Where is your pain?', 'groin_thigh');
      selector.addResponse('Q9', 'Any difficulty with groin/thigh?', []);
      selector.addResponse('Q13', 'Lost bladder/bowel control?', 'no');
      selector.addResponse('Q14', 'Progressive leg weakness?', 'no');
      selector.addResponse('Q15', 'Numbness in groin area?', 'no');
      selector.addResponse('Q16', 'Severe unrelenting pain?', 'no');
      
      const guide = selector.selectEducationalGuide();
      expect(guide).toBe('si_joint_dysfunction');
    });
  });

  describe('Canal Stenosis Pattern', () => {
    test('should identify canal stenosis with classic pattern', () => {
      selector.addResponse('Q1', 'Where is your pain?', 'back_both_legs');
      selector.addResponse('Q7', 'When is pain worse?', 'worse_standing');
      selector.addResponse('Q8', 'What relieves pain?', 'sitting_bending');
      selector.addResponse('Q13', 'Lost bladder/bowel control?', 'no');
      selector.addResponse('Q14', 'Progressive leg weakness?', 'no');
      selector.addResponse('Q15', 'Numbness in groin area?', 'no');
      selector.addResponse('Q16', 'Severe unrelenting pain?', 'no');
      
      const guide = selector.selectEducationalGuide();
      expect(guide).toBe('canal_stenosis');
    });
  });

  describe('Central Disc Bulge Pattern', () => {
    test('should identify central disc bulge with constant pain', () => {
      selector.addResponse('Q1', 'Where is your pain?', 'back_both_legs');
      selector.addResponse('Q7', 'When is pain worse?', 'constant');
      selector.addResponse('Q13', 'Lost bladder/bowel control?', 'no');
      selector.addResponse('Q14', 'Progressive leg weakness?', 'no');
      selector.addResponse('Q15', 'Numbness in groin area?', 'no');
      selector.addResponse('Q16', 'Severe unrelenting pain?', 'no');
      
      const guide = selector.selectEducationalGuide();
      expect(guide).toBe('central_disc_bulge');
    });

    test('should identify central disc bulge with sitting pain', () => {
      selector.addResponse('Q1', 'Where is your pain?', 'back_both_legs');
      selector.addResponse('Q7', 'When is pain worse?', 'worse_sitting');
      selector.addResponse('Q13', 'Lost bladder/bowel control?', 'no');
      selector.addResponse('Q14', 'Progressive leg weakness?', 'no');
      selector.addResponse('Q15', 'Numbness in groin area?', 'no');
      selector.addResponse('Q16', 'Severe unrelenting pain?', 'no');
      
      const guide = selector.selectEducationalGuide();
      expect(guide).toBe('central_disc_bulge');
    });
  });

  describe('Default to Muscular NSLBP', () => {
    test('should default to muscular NSLBP when no specific pattern matches', () => {
      selector.addResponse('Q1', 'Where is your pain?', 'back_only');
      selector.addResponse('Q2', 'What makes pain worse?', ['none']);
      selector.addResponse('Q13', 'Lost bladder/bowel control?', 'no');
      selector.addResponse('Q14', 'Progressive leg weakness?', 'no');
      selector.addResponse('Q15', 'Numbness in groin area?', 'no');
      selector.addResponse('Q16', 'Severe unrelenting pain?', 'no');
      
      const guide = selector.selectEducationalGuide();
      expect(guide).toBe('muscular_nslbp');
    });

    test('should default to muscular NSLBP for unexpected Q1 answer', () => {
      selector.addResponse('Q1', 'Where is your pain?', 'unexpected_value');
      selector.addResponse('Q13', 'Lost bladder/bowel control?', 'no');
      selector.addResponse('Q14', 'Progressive leg weakness?', 'no');
      selector.addResponse('Q15', 'Numbness in groin area?', 'no');
      selector.addResponse('Q16', 'Severe unrelenting pain?', 'no');
      
      const guide = selector.selectEducationalGuide();
      expect(guide).toBe('muscular_nslbp');
    });
  });

  describe('Disclosure Generation', () => {
    test('should generate appropriate disclosures for each response', () => {
      selector.addResponse('Q1', 'Where is your pain?', 'back_both_legs');
      selector.addResponse('Q4', 'Does leg pain go below knee?', 'yes');
      selector.addResponse('Q13', 'Lost bladder/bowel control?', 'no');
      
      const session = selector.getSession();
      
      expect(session.disclosures).toContain('You indicated your pain is located: back_both_legs');
      expect(session.disclosures).toContain('You indicated leg pain below the knee');
      expect(session.disclosures).toContain('You indicated NO to: Question 13');
    });

    test('should handle array answers in disclosures', () => {
      selector.addResponse('Q2', 'What makes pain worse?', ['bending_forward', 'sitting']);
      
      const session = selector.getSession();
      expect(session.disclosures).toContain('You indicated: bending_forward, sitting');
    });
  });

  describe('Session Management', () => {
    test('should create unique session ID', () => {
      const selector1 = new EducationalGuideSelector();
      const selector2 = new EducationalGuideSelector();
      
      const session1 = selector1.getSession();
      const session2 = selector2.getSession();
      
      expect(session1.sessionId).toBeTruthy();
      expect(session2.sessionId).toBeTruthy();
      expect(session1.sessionId).not.toBe(session2.sessionId);
    });

    test('should track all responses in session', () => {
      selector.addResponse('Q1', 'Where is your pain?', 'back_only');
      selector.addResponse('Q2', 'What makes pain worse?', ['sitting']);
      selector.addResponse('Q3', 'Another question?', 'answer');
      
      const session = selector.getSession();
      expect(session.responses).toHaveLength(3);
      expect(session.responses[0].questionId).toBe('Q1');
      expect(session.responses[1].questionId).toBe('Q2');
      expect(session.responses[2].questionId).toBe('Q3');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty responses map', () => {
      const guide = selector.selectEducationalGuide();
      expect(guide).toBe('muscular_nslbp'); // Default
    });

    test('should handle missing Q1 response', () => {
      selector.addResponse('Q13', 'Lost bladder/bowel control?', 'no');
      selector.addResponse('Q14', 'Progressive leg weakness?', 'no');
      
      const guide = selector.selectEducationalGuide();
      expect(guide).toBe('muscular_nslbp'); // Default
    });

    test('should handle multiple selection including "none"', () => {
      selector.addResponse('Q1', 'Where is your pain?', 'back_one_leg');
      selector.addResponse('Q4', 'Does leg pain go below knee?', 'no');
      selector.addResponse('Q6', 'Any difficulty?', ['none', 'weakness']); // Contradictory
      
      const guide = selector.selectEducationalGuide();
      // Should still process as having symptoms
      expect(guide).toBe('upper_lumbar_radiculopathy');
    });
  });
});