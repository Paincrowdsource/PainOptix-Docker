import { EducationalGuideSelector } from './educational-guide-selector';

describe('Algorithm Integration Tests', () => {
  test('should identify sciatica when leg pain goes below knee', () => {
    const selector = new EducationalGuideSelector();
    
    selector.addResponse('Q1', 'Where is your pain?', 'back_one_leg');
    selector.addResponse('Q4', 'Does leg pain go below knee?', 'yes');
    selector.addResponse('Q13', 'Lost bladder/bowel control?', 'no');
    selector.addResponse('Q14', 'Progressive leg weakness?', 'no');
    selector.addResponse('Q15', 'Numbness in groin area?', 'no');
    selector.addResponse('Q16', 'Severe unrelenting pain?', 'no');
    
    const guide = selector.selectEducationalGuide();
    expect(guide).toBe('sciatica');
    
    const session = selector.getSession();
    expect(session.disclosures).toContain('You indicated your pain is located: back_one_leg');
    expect(session.disclosures).toContain('You indicated leg pain below the knee');
  });

  test('should identify urgent symptoms when red flags present', () => {
    const selector = new EducationalGuideSelector();
    
    selector.addResponse('Q1', 'Where is your pain?', 'back_only');
    selector.addResponse('Q13', 'Lost bladder/bowel control?', 'yes');
    
    const guide = selector.selectEducationalGuide();
    expect(guide).toBe('urgent_symptoms');
  });

  test('should identify facet arthropathy with backward bending pain', () => {
    const selector = new EducationalGuideSelector();
    
    selector.addResponse('Q1', 'Where is your pain?', 'back_only');
    selector.addResponse('Q2', 'What makes pain worse?', ['bending_backward']);
    selector.addResponse('Q13', 'Lost bladder/bowel control?', 'no');
    selector.addResponse('Q14', 'Progressive leg weakness?', 'no');
    selector.addResponse('Q15', 'Numbness in groin area?', 'no');
    selector.addResponse('Q16', 'Severe unrelenting pain?', 'no');
    
    const guide = selector.selectEducationalGuide();
    expect(guide).toBe('facet_arthropathy');
  });

  test('should identify upper lumbar radiculopathy with neurological symptoms', () => {
    const selector = new EducationalGuideSelector();
    
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
});