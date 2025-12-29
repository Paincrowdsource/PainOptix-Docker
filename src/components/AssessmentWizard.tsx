import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Loader2, Info, CheckCircle, AlertCircle, Check, Star, Zap, BookOpen, Shield, Lock, Award, Activity, Crown, Phone, RefreshCw } from 'lucide-react';
import { withRetry, storeFailedOperation, isRetriableError, generateErrorCode } from '@/lib/error-recovery';

// Components
import ProgressBar from './ProgressBar';
import { FieldGroup, FormLabel, FormRadioGroup, FormRadioItem, FormCheckbox } from './FieldGroup';
import { ContactCollection } from './ContactCollection';
import { CheckYourInbox } from './CheckYourInbox';
import { DeliveryPreferencesForm } from './DeliveryPreferencesForm';

// Algorithm imports
import { Questions, EducationalGuide } from '@/types/algorithm';
import { EducationalGuideSelector } from '@/lib/algorithm/educational-guide-selector';
import { QuestionFlow } from '@/lib/algorithm/question-flow';

interface AssessmentWizardProps {
  onComplete?: (guideType: EducationalGuide, sessionId: string) => void;
}

type WizardStep = 'disclaimer' | 'assessment' | 'contact' | 'delivery' | 'complete';

// Draft persistence constants
const DRAFT_STORAGE_KEY = 'painoptix_assessment_draft';
const DRAFT_EXPIRY_HOURS = 24;

// Draft type for localStorage persistence
interface AssessmentDraft {
  responses: [string, any][]; // Map entries as array
  currentQuestionId: string;
  sessionId: string;
  disclaimerAccepted: boolean;
  savedAt: string; // ISO timestamp
}

export const AssessmentWizard: React.FC<AssessmentWizardProps> = ({ onComplete }) => {
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

  // Draft recovery state
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [savedDraft, setSavedDraft] = useState<AssessmentDraft | null>(null);

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

  // Auto-save draft to localStorage after each answer
  useEffect(() => {
    if (responses.size > 0 && currentStep === 'assessment') {
      const draft: AssessmentDraft = {
        responses: Array.from(responses.entries()),
        currentQuestionId,
        sessionId,
        disclaimerAccepted,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    }
  }, [responses, currentQuestionId, sessionId, disclaimerAccepted, currentStep]);

  // Check for saved draft on component mount
  useEffect(() => {
    const draftJson = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (draftJson) {
      try {
        const draft: AssessmentDraft = JSON.parse(draftJson);
        const savedAt = new Date(draft.savedAt);
        const hoursSinceSave = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60);

        // Only offer to resume if draft is less than 24 hours old and has responses
        if (hoursSinceSave < DRAFT_EXPIRY_HOURS && draft.responses.length > 0) {
          setSavedDraft(draft);
          setShowResumeModal(true);
        } else {
          // Clear expired draft
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      } catch (e) {
        console.error('Failed to parse saved draft:', e);
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    }
  }, []);

  // Resume from saved draft
  const handleResumeDraft = () => {
    if (savedDraft) {
      setResponses(new Map(savedDraft.responses));
      setCurrentQuestionId(savedDraft.currentQuestionId);
      setSessionId(savedDraft.sessionId);
      setDisclaimerAccepted(true);
      setCurrentStep('assessment');

      // Restore guideSelector state
      savedDraft.responses.forEach(([questionId, answer]) => {
        const question = Questions[questionId as keyof typeof Questions];
        if (question) {
          guideSelector.addResponse(questionId, question.text, answer);
        }
      });
    }
    setShowResumeModal(false);
  };

  // Start fresh, discard draft
  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setSavedDraft(null);
    setShowResumeModal(false);
  };

  // Track progress helper function
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

  // Mark session as complete
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
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  // Get current question with bounds checking
  const currentQuestion = Questions[currentQuestionId as keyof typeof Questions];
  
  // Safety check - if question doesn't exist, move to contact
  if (!currentQuestion && currentStep === 'assessment') {
    console.error('âŒ No question found for ID:', currentQuestionId);
    console.log('ðŸ“‹ All questions:', Object.keys(Questions).map(id => ({
      id,
      text: Questions[id as keyof typeof Questions].text.substring(0, 50) + '...',
      hasNoneOption: Questions[id as keyof typeof Questions].options?.some((o: any) => o.value === 'none')
    })));
    setCurrentStep('contact');
  }

  // Track when user views a question
  useEffect(() => {
    if (currentStep === 'assessment' && currentQuestion && sessionId) {
      // Track viewing of current question (without answer)
      trackProgress(
        currentQuestionId,
        currentStepNumber,
        currentQuestion.text
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionId, currentStep, sessionId]);

  // Calculate progress
  const currentStepNumber = Math.max(1, responses.size + 1); // This is the actual step count
  
  // Use the algorithm's dynamic progress calculation
  const progress = Math.max(0, questionFlow.getProgress(responses));
  
  // Get a reasonable estimate of total steps based on typical paths
  // Most users answer: Q1 + 3 functional + 4 red flags + 4-8 path-specific = 12-16 questions
  const getEstimatedTotal = () => {
    // Early in assessment, show conservative estimate
    if (currentStepNumber <= 2) return 14; // ~14 questions is typical
    
    // Once we have more info, use progress if reasonable
    if (progress > 10) {
      const calculated = Math.ceil(currentStepNumber / (progress / 100));
      // Cap at reasonable maximum (paths are 10-16 questions)
      return Math.min(calculated, 18);
    }
    
    // Default to typical path length
    return 15;
  };
  
  const dynamicTotal = getEstimatedTotal();
  
  // Debug logging
  if (currentStepNumber <= 3) {
    console.log('Assessment Progress:', {
      currentStep: currentStepNumber,
      progress: progress + '%',
      estimatedTotal: dynamicTotal,
      responses: responses.size
    });
  }

  // Handle answer change
  const handleAnswerChange = (value: any) => {
    setCurrentAnswer(value);
    setErrors('');
  };

  // Validate current answer
  const validateAnswer = (): boolean => {
    if (!currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0)) {
      setErrors('Please select an answer');
      return false;
    }
    return true;
  };

  // Handle next question
  const handleNext = async () => {
    if (!validateAnswer()) return;

    // Add response to selector and responses map
    const question = Questions[currentQuestionId as keyof typeof Questions];
    guideSelector.addResponse(currentQuestionId, question.text, currentAnswer);
    
    const newResponses = new Map(responses);
    newResponses.set(currentQuestionId, currentAnswer);
    setResponses(newResponses);

    // Track the answered question
    await trackProgress(
      currentQuestionId,
      currentStepNumber,
      question.text,
      currentAnswer
    );

    // Get next question
    const nextQuestion = questionFlow.getNextQuestion(newResponses);
    
    console.log('ðŸ“Š Assessment flow:', {
      currentQuestionId,
      answeredQuestions: Array.from(newResponses.keys()),
      nextQuestion,
      totalResponses: newResponses.size
    });
    
    if (nextQuestion) {
      setCurrentQuestionId(nextQuestion);
      setCurrentAnswer('');
      // Track viewing of next question
      const nextQ = Questions[nextQuestion as keyof typeof Questions];
      if (nextQ) {
        await trackProgress(
          nextQuestion,
          currentStepNumber + 1,
          nextQ.text
        );
      }
    } else {
      // All questions answered, move to contact collection
      console.log('✅ All questions answered, moving to contact form');
      setCurrentStep('contact');
    }
  };

  // Handle previous question
  const handlePrevious = () => {
    // Get all answered questions
    const answeredQuestions = Array.from(responses.keys());
    
    // If we have answered questions, go to the last one
    if (answeredQuestions.length > 0) {
      // Remove the current question's answer from responses
      const newResponses = new Map(responses);
      newResponses.delete(currentQuestionId);
      setResponses(newResponses);
      
      // Find the previous question ID
      const previousQuestionId = answeredQuestions[answeredQuestions.length - 1];
      setCurrentQuestionId(previousQuestionId);
      setCurrentAnswer(responses.get(previousQuestionId) || '');
    }
  };

  // Handle contact submission
  const handleContactSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      // Get the selected educational guide
      const selectedGuide = guideSelector.selectEducationalGuide();
      const session = guideSelector.getSession();
      
      // Store contact info
      setContactInfo({
        method: data.contactMethod,
        value: data.email || data.phoneNumber
      });

      // Prepare responses array - filter out any empty answers
      const responsesArray = Array.from(responses.entries())
        .filter(([questionId, answer]) => {
          // Ensure answer is not empty
          if (!answer || answer === '') {
            console.warn(`Skipping empty answer for question ${questionId}`);
            return false;
          }
          return true;
        })
        .map(([questionId, answer]) => ({
          questionId,
          question: Questions[questionId as keyof typeof Questions].text,
          answer: String(answer) // Ensure answer is a string
        }));

      // Ensure we have at least one response
      if (responsesArray.length === 0) {
        throw new Error('No valid responses found. Please complete the assessment.');
      }

      // Store selected guide and disclosures
      setSelectedGuide(selectedGuide);
      setDisclosures(session.disclosures);
      
      // Submit to API to create assessment record with retry
      const submitData = {
        responses: responsesArray,
        name: data.name,
        contactMethod: data.contactMethod,
        email: data.email,
        phoneNumber: data.phoneNumber,
        initialPainScore: data.initialPainScore,
        referrerSource: new URLSearchParams(window.location.search).get('ref') || 'organic',
        guideType: selectedGuide,
        disclosures: session.disclosures
      };

      const submitAssessment = async () => {
        const response = await fetch('/api/assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        });

        const result = await response.json();
        
        if (!response.ok) {
          const error: any = new Error(result.error || 'Failed to submit assessment');
          error.status = response.status;
          throw error;
        }
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to submit assessment');
        }
        
        return result;
      };

      let result;
      try {
        result = await withRetry(submitAssessment, {
          maxRetries: 3,
          shouldRetry: (error) => isRetriableError(error)
        });
      } catch (retryError: any) {
        // If all retries failed, store for later
        if (isRetriableError(retryError)) {
          const failureId = await storeFailedOperation('assessment_submission', submitData, retryError);
          
          // Show recovery UI
          toast.error(
            <div>
              <p>Connection issue. Your assessment has been saved.</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Retry now
              </button>
            </div>,
            { duration: 10000, id: failureId }
          );
          
          // Store assessment data in session storage as backup
          sessionStorage.setItem('pending_assessment', JSON.stringify({
            ...submitData,
            failureId,
            timestamp: new Date().toISOString()
          }));
          
          return;
        }
        
        throw retryError;
      }
      
      // Store assessment ID and move to delivery screen
      console.log('Assessment created with ID:', result.assessmentId);
      setAssessmentId(result.assessmentId);

      // Clear draft after successful submission
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      // Mark session as complete
      await completeSession(result.assessmentId);
      setCurrentStep('delivery');
    } catch (error: any) {
      const errorCode = generateErrorCode();
      console.error('Submission error:', error, { errorCode });
      
      if (error.message === 'No valid responses found. Please complete the assessment.') {
        toast.error(error.message);
      } else {
        toast.error(
          <div>
            <p>Failed to submit assessment</p>
            <p className="text-xs mt-1">Error code: {errorCode}</p>
          </div>
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle payment tier selection
  const handlePaymentSelection = async (tier: 'free' | 'enhanced' | 'monograph') => {
    setIsSubmitting(true);
    
    try {
      if (tier === 'free') {
        // For free tier, send the guide immediately
        const response = await fetch('/api/send-guide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessmentId,
            tier: 'free'
          })
        });
        
        const result = await response.json();
        if (!result.success) {
          throw new Error('Failed to send guide');
        }
        
        setCurrentStep('complete');
        toast.success('Free guide sent successfully!');
      } else {
        // For paid tiers, create Stripe checkout
        const tierPrice = tier === 'enhanced' ? 5 : 20;
        console.log('ðŸ›’ Creating checkout for assessment:', assessmentId);
        const response = await fetch('/api/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessmentId,
            priceId: tier,
            tierPrice
          })
        });
        
        const result = await response.json();
        if (!result.url) {
          throw new Error('Failed to create checkout session');
        }
        
        // Redirect to Stripe
        window.location.href = result.url;
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
      console.error('Payment error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render based on current step

  // Resume Modal (shown before disclaimer if draft exists)
  if (showResumeModal && savedDraft) {
    const savedAt = new Date(savedDraft.savedAt);
    const questionsAnswered = savedDraft.responses.length;

    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <div className="medical-card">
          <h2 className="text-center mb-6 text-xl md:text-2xl">Welcome Back!</h2>

          <div className="info-box mb-6">
            <Info className="icon-sm flex-shrink-0" style={{ color: 'var(--primary-blue)' }} />
            <div>
              <p className="font-semibold mb-2">You have a saved assessment</p>
              <p className="text-sm">
                You answered {questionsAnswered} question{questionsAnswered !== 1 ? 's' : ''} on {savedAt.toLocaleDateString()} at {savedAt.toLocaleTimeString()}.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleResumeDraft}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Continue Assessment
            </button>
            <button
              onClick={handleDiscardDraft}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'disclaimer') {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <div className="medical-card">
          <h2 className="text-center mb-6 text-xl md:text-2xl">Before We Begin</h2>
          
          <div className="info-box mb-6">
            <Info className="icon-sm flex-shrink-0" style={{ color: 'var(--primary-blue)' }} />
            <div>
              <p className="text-sm">
                This tool looks for patterns, not perfect answers. Choose what feels closest most of the time — there are no wrong responses. You can stop at any point and come back later. Everything you enter is saved.
              </p>
            </div>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <CheckCircle className="icon-sm mt-0.5" style={{ color: 'var(--success-green)' }} />
              <p>16 clinically-validated questions</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="icon-sm mt-0.5" style={{ color: 'var(--success-green)' }} />
              <p>Personalized educational guide delivered to your inbox</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="icon-sm mt-0.5" style={{ color: 'var(--success-green)' }} />
              <p>Takes approximately 2-3 minutes to complete</p>
            </div>
          </div>
          
          <div className="disclaimer-box mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={disclaimerAccepted}
                onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">
                I understand that PainFinder™ is an educational tool, not a diagnostic tool, and I agree to the terms of service.
                <br /><br />
                <strong>I explicitly consent to receive SMS messages</strong> from PainOptix / Dr. C. Pain MD Holdings, LLC at the phone number I provide. I understand that message and data rates may apply.
                <br /><br />
                Reply <strong>STOP</strong> to unsubscribe at any time, or <strong>HELP</strong> for assistance.
              </span>
            </label>
          </div>
          
          <div className="text-center">
            <button
              onClick={async () => {
                setIsStartingAssessment(true);
                // Slight delay to show the feedback
                await new Promise(resolve => setTimeout(resolve, 300));
                setCurrentStep('assessment');
                // Track assessment start
                const firstQuestion = Questions.Q1;
                await trackProgress('Q1', 1, firstQuestion.text, undefined, true);
                setIsStartingAssessment(false);
              }}
              disabled={!disclaimerAccepted || isStartingAssessment}
              className={`
                relative w-full md:w-auto px-8 py-4 
                font-semibold text-lg rounded-xl
                transition-all duration-200 transform
                ${disclaimerAccepted && !isStartingAssessment
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {isStartingAssessment ? (
                <>
                  <Loader2 className="inline-block w-5 h-5 mr-2 animate-spin" />
                  Starting Assessment...
                </>
              ) : (
                <>
                  Start Assessment
                  <ArrowRight className="inline-block ml-2 w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (currentStep === 'contact') {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <ContactCollection
          onSubmit={handleContactSubmit}
          onBack={() => setCurrentStep('assessment')}
        />
      </div>
    );
  }

  if (currentStep === 'delivery') {
    // Prepare responses array for DeliveryPreferencesForm
    const responsesArray = Array.from(responses.entries())
      .filter(([questionId, answer]) => answer && answer !== '')
      .map(([questionId, answer]) => ({
        questionId,
        question: Questions[questionId as keyof typeof Questions]?.text || '',
        answer: String(answer)
      }));

    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <DeliveryPreferencesForm
          assessmentId={assessmentId}
          prefillEmail={contactInfo.value}
          prefillName={contactInfo.method === 'email' ? '' : ''}
          guideType={selectedGuide || undefined}
          disclosures={disclosures}
          responses={responsesArray}
          initialPainScore={5}
          onSuccess={(id) => {
            // Redirect to guide page with success parameter
            window.location.href = `/guide/${id}?payment=success`;
          }}
          onBack={() => setCurrentStep('contact')}
        />
      </div>
    );
  }

  if (currentStep === 'complete') {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <CheckYourInbox
          contactMethod={contactInfo.method}
          contactInfo={contactInfo.value}
        />
      </div>
    );
  }

  // Render assessment questions
  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 animate-fadeIn">
      <div className="mb-6 md:mb-8">
        <ProgressBar currentStep={currentStepNumber} totalSteps={dynamicTotal} />
      </div>

      <div className="medical-card question-container">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
          <h2 className="text-lg md:text-xl lg:text-2xl font-semibold">
            Step {currentStepNumber}
          </h2>
          <span className="badge-success text-sm">
            {Math.round(progress)}% Complete
          </span>
        </div>
        
        {/* Explanation for adaptive assessment */}
        {currentStepNumber === 1 && (
          <p className="text-sm text-gray-600 mb-4 italic">
            <span className="inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              This assessment adapts to your specific symptoms
            </span>
          </p>
        )}

        <div className="mb-8">
          <FormLabel className="text-lg font-medium mb-6 block text-gray-900">
            {currentQuestion ? currentQuestion.text : 'Loading question...'}
          </FormLabel>
          
          <FieldGroup>
            {currentQuestion && currentQuestion.type === 'single' ? (
              <FormRadioGroup
                value={currentAnswer || ''}
                onValueChange={handleAnswerChange}
              >
                {currentQuestion?.options?.map(opt => (
                  <div 
                    key={opt.value} 
                    className={`radio-option mb-3 ${currentAnswer === opt.value ? 'selected' : ''}`}
                  >
                    <FormRadioItem
                      value={opt.value}
                      id={`${currentQuestionId}-${opt.value}`}
                    >
                      {opt.label}
                    </FormRadioItem>
                  </div>
                ))}
              </FormRadioGroup>
            ) : (
              <div className="space-y-3">
                {currentQuestion?.options?.map(opt => (
                  <div 
                    key={opt.value} 
                    className={`radio-option ${(currentAnswer || []).includes(opt.value) ? 'selected' : ''}`}
                  >
                    <FormCheckbox
                      id={`${currentQuestionId}-${opt.value}`}
                      checked={(currentAnswer || []).includes(opt.value)}
                      onCheckedChange={(checked) => {
                        const current = currentAnswer || [];
                        if (checked) {
                          // If selecting "none", clear all other selections
                          if (opt.value === 'none') {
                            handleAnswerChange(['none']);
                          } else {
                            // If selecting something else, remove "none" if present
                            const filtered = current.filter((v: string) => v !== 'none');
                            handleAnswerChange([...filtered, opt.value]);
                          }
                        } else {
                          handleAnswerChange(current.filter((v: string) => v !== opt.value));
                        }
                      }}
                    >
                      {opt.label}
                    </FormCheckbox>
                  </div>
                ))}
              </div>
            )}
          </FieldGroup>
          
          {errors && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm flex items-center gap-2">
                <AlertCircle className="icon-sm" />
                {errors}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-6 border-t" style={{ borderColor: 'var(--border-light)' }}>
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentQuestionId === 'Q1'}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: currentQuestionId === 'Q1' ? 'var(--text-secondary)' : 'var(--primary-blue)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting || !currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0)}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      <div className="disclaimer-box mt-6 text-center">
        <p className="text-sm">
          Your responses are being tracked to provide personalized educational information. 
          This is not a medical diagnosis.
        </p>
      </div>
    </div>
  );
};





