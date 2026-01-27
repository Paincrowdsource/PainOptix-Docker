import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Loader2, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { withRetry, storeFailedOperation, isRetriableError, generateErrorCode } from '@/lib/error-recovery';

// Components
import ProgressBar from './ProgressBar';
import { FieldGroup, FormLabel, FormRadioGroup, FormRadioItem, FormCheckbox, FormInput } from './FieldGroup';
import { ContactCollection } from './ContactCollection';
import { CheckYourInbox } from './CheckYourInbox';

// Algorithm imports
import { Questions, EducationalGuide } from '@/types/algorithm';
import { EducationalGuideSelector } from '@/lib/algorithm/educational-guide-selector';
import { QuestionFlow } from '@/lib/algorithm/question-flow';

interface AssessmentWizardProps {
  onComplete?: (guideType: EducationalGuide, sessionId: string) => void;
}

type WizardStep = 'disclaimer' | 'assessment' | 'contact' | 'payment' | 'complete';

// Screen reader announcements hook
function useAnnouncement() {
  const [announcement, setAnnouncement] = useState('');
  const announcementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (announcement && announcementRef.current) {
      announcementRef.current.textContent = announcement;
    }
  }, [announcement]);

  return {
    announce: setAnnouncement,
    AnnouncementRegion: () => (
      <div
        ref={announcementRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    )
  };
}

export const AccessibleAssessmentWizard: React.FC<AssessmentWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('disclaimer');
  const [currentQuestionId, setCurrentQuestionId] = useState<string>('Q1');
  const [responses, setResponses] = useState<Map<string, any>>(new Map());
  const [currentAnswer, setCurrentAnswer] = useState<any>('');
  const [errors, setErrors] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [isStartingAssessment, setIsStartingAssessment] = useState(false);
  
  // Session tracking state
  const [sessionId, setSessionId] = useState<string>('');
  
  // Contact info state
  const [contactInfo, setContactInfo] = useState<{
    method: 'email' | 'sms';
    value: string;
  }>({ method: 'email', value: '' });
  
  // Payment state
  const [assessmentId, setAssessmentId] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<'free' | 'enhanced' | 'monograph'>('free');
  const [selectedGuide, setSelectedGuide] = useState<EducationalGuide | null>(null);
  const [disclosures, setDisclosures] = useState<string[]>([]);

  // Algorithm instances
  const [guideSelector] = useState(() => new EducationalGuideSelector());
  const [questionFlow] = useState(() => new QuestionFlow());

  // Accessibility
  const { announce, AnnouncementRegion } = useAnnouncement();
  const mainContentRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Debounce ref to prevent duplicate submissions
  const lastSubmitTimeRef = useRef<number>(0);

  // Initialize session on component mount
  useEffect(() => {
    // Generate or retrieve session ID
    let storedSessionId = sessionStorage.getItem('assessment_session_id');
    if (!storedSessionId) {
      storedSessionId = crypto.randomUUID();
      sessionStorage.setItem('assessment_session_id', storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  // Focus management
  useEffect(() => {
    // Focus main content when step changes
    if (mainContentRef.current) {
      mainContentRef.current.focus();
    }
  }, [currentStep, currentQuestionId]);

  // Keyboard navigation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          if (canGoBack()) {
            e.preventDefault();
            handleBack();
          }
          break;
        case 'ArrowRight':
          if (canProceed()) {
            e.preventDefault();
            handleNext();
          }
          break;
        case 'Escape':
          // Announce current state
          announce(`You are on ${currentStep === 'assessment' ? 'question ' + getQuestionNumber() : currentStep} step`);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, currentQuestionId, currentAnswer]);

  const trackProgress = async (
    questionId: string,
    questionNumber: number,
    questionText: string,
    answer?: any,
    isStarting?: boolean
  ) => {
    try {
      await fetch('/api/track-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId,
          questionNumber,
          questionText,
          answer,
          isStarting,
          userAgent: navigator.userAgent,
          referrerSource: new URLSearchParams(window.location.search).get('ref') || 'organic'
        })
      });
    } catch (error) {
      console.error('Failed to track progress:', error);
    }
  };

  const completeSession = async (assessmentId: string) => {
    try {
      await fetch('/api/track-progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          assessmentId
        })
      });
    } catch {
      // Silent fail - don't break the flow
    }
  };

  const getCurrentQuestion = () => {
    return Questions[currentQuestionId as keyof typeof Questions];
  };

  const getQuestionNumber = () => {
    const answeredQuestions = Array.from(responses.keys());
    return answeredQuestions.length + 1;
  };

  const getTotalQuestions = () => {
    // Estimate based on typical flow
    return 16;
  };

  const canProceed = () => {
    if (currentStep === 'disclaimer') {
      return disclaimerAccepted;
    }
    if (currentStep === 'assessment') {
      return currentAnswer !== '' && !errors;
    }
    if (currentStep === 'contact') {
      return contactInfo.value !== '';
    }
    return true;
  };

  const canGoBack = () => {
    if (currentStep === 'assessment') {
      const answeredQuestions = Array.from(responses.keys());
      return answeredQuestions.length > 0;
    }
    return false;
  };

  const handleNext = async () => {
    if (currentStep === 'disclaimer') {
      setIsStartingAssessment(true);
      await trackProgress('start', 0, 'Assessment Started', undefined, true);
      setCurrentStep('assessment');
      setIsStartingAssessment(false);
      announce('Starting assessment. Question 1 of approximately 16.');
    } else if (currentStep === 'assessment') {
      await handleQuestionSubmit();
    } else if (currentStep === 'contact') {
      await handleContactSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep === 'assessment' && responses.size > 0) {
      const answeredQuestions = Array.from(responses.keys());
      const previousQuestionId = answeredQuestions[answeredQuestions.length - 1];
      
      // Remove the last response
      const newResponses = new Map(responses);
      newResponses.delete(previousQuestionId);
      setResponses(newResponses);
      
      // Remove from guide selector
      const previousAnswer = responses.get(previousQuestionId);
      // Note: Guide selector doesn't support removing responses, so we'd need to rebuild
      
      // Set the current question to the previous one
      setCurrentQuestionId(previousQuestionId);
      setCurrentAnswer(responses.get(previousQuestionId) || '');
      
      announce(`Returned to question ${answeredQuestions.length}`);
    }
  };

  const handleQuestionSubmit = async () => {
    const question = getCurrentQuestion();
    if (!question) return;

    // Track the response
    await trackProgress(
      currentQuestionId,
      getQuestionNumber(),
      question.text,
      currentAnswer
    );

    // Store response
    const newResponses = new Map(responses);
    newResponses.set(currentQuestionId, currentAnswer);
    setResponses(newResponses);

    // Add to guide selector
    guideSelector.addResponse(currentQuestionId, question.text, currentAnswer);

    // Check for red flags early
    if (['Q13', 'Q14', 'Q15', 'Q16'].includes(currentQuestionId) && currentAnswer === 'yes') {
      announce('Important: You have indicated a symptom that requires immediate medical attention.');
    }

    // Get next question
    const nextQuestionId = questionFlow.getNextQuestion(responses);

    if (nextQuestionId) {
      setCurrentQuestionId(nextQuestionId);
      setCurrentAnswer('');
      announce(`Question ${getQuestionNumber() + 1} of approximately ${getTotalQuestions()}`);
    } else {
      // Assessment complete
      const guide = guideSelector.selectEducationalGuide();
      const session = guideSelector.getSession();
      
      setSelectedGuide(guide);
      setDisclosures(session.disclosures);
      setCurrentStep('contact');
      
      if (guide === 'urgent_symptoms') {
        announce('Assessment complete. You have indicated symptoms that require immediate medical attention. Please proceed to enter your contact information.');
      } else {
        announce('Assessment complete. Please enter your contact information to receive your personalized educational guide.');
      }
    }
  };

  const handleContactSubmit = async () => {
    // Debounce: prevent rapid duplicate submissions (2 second window)
    const now = Date.now();
    if (now - lastSubmitTimeRef.current < 2000) {
      console.log('Debounce: Ignoring duplicate submission within 2 seconds');
      return;
    }
    lastSubmitTimeRef.current = now;

    setIsSubmitting(true);
    setErrors('');

    const submitAssessment = async () => {
      const assessmentData = {
        responses: Array.from(responses.entries()).map(([questionId, answer]) => ({
          questionId,
          question: Questions[questionId as keyof typeof Questions]?.text || '',
          answer
        })),
        contactMethod: contactInfo.method,
        email: contactInfo.method === 'email' ? contactInfo.value : undefined,
        phoneNumber: contactInfo.method === 'sms' ? contactInfo.value : undefined,
        initialPainScore: 0, // We're not collecting this anymore
        referrerSource: new URLSearchParams(window.location.search).get('ref') || 'organic'
      };

      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessmentData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit assessment');
      }

      const result = await response.json();
      return result;
    };

    try {
      const result = await withRetry(submitAssessment, {
        maxRetries: 3,
        shouldRetry: (error) => isRetriableError(error)
      });
      
      setAssessmentId(result.assessmentId);
      
      // Complete session tracking
      await completeSession(result.assessmentId);
      
      setCurrentStep('complete');
      
      // Call onComplete callback if provided
      if (onComplete && selectedGuide) {
        onComplete(selectedGuide, sessionId);
      }
      
      announce('Assessment submitted successfully. Your guide has been sent to your ' + 
               (contactInfo.method === 'email' ? 'email address' : 'phone number') + '.');
      
    } catch (error: any) {
      const errorCode = generateErrorCode();
      
      // Store failed submission for later retry
      if (isRetriableError(error)) {
        await storeFailedOperation('assessment_submission', {
          responses: Array.from(responses.entries()),
          contactInfo,
          sessionId
        }, error);
        
        setErrors('We\'re having trouble connecting. Your assessment has been saved and will be submitted automatically when connection is restored.');
        announce('Connection error. Your assessment has been saved for automatic retry.');
      } else {
        setErrors(error.message || 'Failed to submit assessment. Please try again.');
        announce('Error submitting assessment. ' + (error.message || 'Please try again.'));
      }
      
      console.error('Assessment submission error:', errorCode, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'disclaimer':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Info className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Important Information
              </h1>
              <p className="text-lg text-gray-600">
                Please read carefully before proceeding
              </p>
            </div>
            
            <div 
              className="bg-blue-50 border border-blue-200 rounded-lg p-6"
              role="region"
              aria-labelledby="disclaimer-heading"
            >
              <h2 id="disclaimer-heading" className="text-lg font-semibold text-blue-900 mb-3">
                Medical Disclaimer
              </h2>
              <div className="space-y-3 text-sm text-blue-800">
                <p>
                  This assessment tool is designed for <strong>educational purposes only</strong> and 
                  does not provide medical diagnosis, treatment recommendations, or medical advice.
                </p>
                <p>
                  The information provided should not replace consultation with qualified healthcare 
                  professionals. Always seek the advice of your physician or other qualified health 
                  provider with any questions you may have regarding a medical condition.
                </p>
                <p>
                  If you are experiencing a medical emergency, please call emergency services immediately.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <FormCheckbox
                id="disclaimer-accept"
                checked={disclaimerAccepted}
                onCheckedChange={(checked) => {
                  setDisclaimerAccepted(checked);
                  announce(checked ? 'Disclaimer accepted' : 'Disclaimer unchecked');
                }}
                aria-describedby="disclaimer-heading"
              >
                I understand and acknowledge that this is an educational tool only
              </FormCheckbox>
            </div>
          </div>
        );

      case 'assessment':
        const question = getCurrentQuestion();
        if (!question) return null;

        return (
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-sm text-gray-500" id="question-progress">
                Question {getQuestionNumber()} of {getTotalQuestions()}
              </span>
              <ProgressBar 
                currentStep={getQuestionNumber()} 
                totalSteps={getTotalQuestions()} 
                className="mt-2"
              />
            </div>

            <FieldGroup>
              <h2 
                id="current-question" 
                className="text-xl font-semibold text-gray-900"
              >
                {question.text}
              </h2>
              
              {question.type === 'single' && (
                <FormRadioGroup
                  value={currentAnswer}
                  onValueChange={(value) => {
                    setCurrentAnswer(value);
                    setErrors('');
                    announce(`Selected: ${question.options?.find(opt => opt.value === value)?.label || value}`);
                  }}
                  aria-labelledby="current-question"
                  
                  aria-describedby={errors ? 'question-error' : undefined}
                >
                  {question.options?.map((option, index) => (
                    <FormRadioItem 
                      key={option.value} 
                      value={option.value}
                      id={`option-${option.value}`}
                    >
                      {option.label}
                    </FormRadioItem>
                  ))}
                </FormRadioGroup>
              )}

              {question.type === 'multiple' && (
                <div 
                  role="group" 
                  aria-labelledby="current-question"
                  
                  aria-describedby={errors ? 'question-error' : undefined}
                >
                  {question.options?.map((option, index) => (
                    <FormCheckbox
                      key={option.value}
                      id={`option-${option.value}`}
                      checked={Array.isArray(currentAnswer) && currentAnswer.includes(option.value)}
                      onCheckedChange={(checked) => {
                        const newAnswer = Array.isArray(currentAnswer) ? [...currentAnswer] : [];
                        if (checked) {
                          newAnswer.push(option.value);
                        } else {
                          const idx = newAnswer.indexOf(option.value);
                          if (idx > -1) newAnswer.splice(idx, 1);
                        }
                        setCurrentAnswer(newAnswer.length > 0 ? newAnswer : '');
                        setErrors('');
                        announce(checked ? 
                          `Checked: ${option.label}` : 
                          `Unchecked: ${option.label}`
                        );
                      }}
                    >
                      {option.label}
                    </FormCheckbox>
                  ))}
                </div>
              )}


              {errors && (
                <p id="question-error" role="alert" className="mt-2 text-sm text-red-600">
                  <AlertCircle className="inline w-4 h-4 mr-1" aria-hidden="true" />
                  {errors}
                </p>
              )}
            </FieldGroup>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6" role="region" aria-labelledby="contact-heading">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" aria-hidden="true" />
              <h2 id="contact-heading" className="text-2xl font-bold text-gray-900 mb-2">
                Assessment Complete!
              </h2>
              <p className="text-gray-600">
                Enter your contact information to receive your personalized educational guide.
              </p>
            </div>

            {selectedGuide === 'urgent_symptoms' && (
              <div 
                className="bg-red-50 border-2 border-red-300 rounded-lg p-4"
                role="alert"
                aria-live="assertive"
              >
                <div className="flex items-start">
                  <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">
                      Immediate Medical Attention Recommended
                    </h3>
                    <p className="text-red-800 text-sm">
                      Based on your responses, you&apos;ve indicated symptoms that may require urgent medical evaluation. 
                      Please contact your healthcare provider or emergency services if you&apos;re experiencing severe symptoms.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-2">How should we send your results?</h3>
              
              <FormRadioGroup
                value={contactInfo.method}
                onValueChange={(method) => {
                  setContactInfo({ ...contactInfo, method: method as 'email' | 'sms' });
                  announce(`Contact method changed to ${method}`);
                }}
              >
                <FormRadioItem value="email" id="method-email">
                  Email
                </FormRadioItem>
                <FormRadioItem value="sms" id="method-sms">
                  Text Message (SMS)
                </FormRadioItem>
              </FormRadioGroup>

              <div>
                <FormLabel htmlFor="contact-value">
                  {contactInfo.method === 'email' ? 'Email Address' : 'Phone Number'}
                </FormLabel>
                <FormInput
                  id="contact-value"
                  type={contactInfo.method === 'email' ? 'email' : 'tel'}
                  value={contactInfo.value}
                  onChange={(e) => setContactInfo({ ...contactInfo, value: e.target.value })}
                  placeholder={contactInfo.method === 'email' ? 'you@example.com' : '(555) 123-4567'}
                  error={errors}
                  required
                />
              </div>
            </div>
          </div>
        );

      case 'complete':
        return <CheckYourInbox contactMethod={contactInfo.method} contactInfo={contactInfo.value} />;

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <AnnouncementRegion />
      
      {/* Skip to main content link */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded">
        Skip to main content
      </a>
      
      <div 
        id="main-content"
        ref={mainContentRef}
        tabIndex={-1}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 focus:outline-none"
        role="main"
        aria-label={`Pain assessment ${currentStep} step`}
      >
        {renderCurrentStep()}
        
        {currentStep !== 'complete' && (
          <div className="mt-8 flex justify-between items-center">
            {canGoBack() ? (
              <button
                onClick={handleBack}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="Go back to previous question"
              >
                <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                Back
              </button>
            ) : (
              <div />
            )}
            
            <button
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting || isStartingAssessment}
              className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={
                currentStep === 'disclaimer' ? 'Start assessment' :
                currentStep === 'assessment' ? 'Next question' :
                currentStep === 'contact' ? 'Submit assessment' :
                'Continue'
              }
            >
              {(isSubmitting || isStartingAssessment) ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                  {isStartingAssessment ? 'Starting...' : 'Submitting...'}
                </>
              ) : (
                <>
                  {currentStep === 'disclaimer' ? 'Start Assessment' :
                   currentStep === 'assessment' ? 'Next' :
                   currentStep === 'contact' ? 'Get My Guide' :
                   'Continue'}
                  <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Keyboard shortcuts help */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <p className="sr-only">
          Keyboard shortcuts: Use arrow keys to navigate between questions. 
          Press Escape to hear your current position.
        </p>
      </div>
    </div>
  );
};












