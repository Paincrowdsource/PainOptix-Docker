import Link from 'next/link';

export default function MedicalDisclaimer() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Medical Disclaimer</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-900 mb-4">⚠️ IMPORTANT MEDICAL DISCLAIMER</h2>
            
            <div className="space-y-4 text-red-800">
              <p className="font-semibold text-lg">
                THE INFORMATION PROVIDED BY PAINOPTIX IS FOR EDUCATIONAL PURPOSES ONLY AND IS NOT 
                INTENDED AS A SUBSTITUTE FOR PROFESSIONAL MEDICAL ADVICE, DIAGNOSIS, OR TREATMENT.
              </p>
              
              <div className="bg-red-100 p-4 rounded">
                <p className="font-bold text-xl mb-2">🚨 MEDICAL EMERGENCY</p>
                <p className="text-lg">
                  If you think you may have a medical emergency, CALL 911 or your local emergency 
                  number IMMEDIATELY. Do not rely on electronic communications or this website for 
                  urgent medical needs.
                </p>
              </div>
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">No Doctor-Patient Relationship</h2>
            <p className="text-gray-700">
              Use of the PainOptix service does not create a doctor-patient relationship between you and 
              PainOptix, Bradley W. Carpentier, MD, or any healthcare provider. The information provided 
              is not a substitute for professional medical care, and you should not use the information 
              in place of a visit, consultation, or the advice of your physician or other healthcare provider.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Educational Purpose Only</h2>
            <p className="text-gray-700">
              All content provided through PainOptix, including assessments, guides, and educational 
              materials, is for informational and educational purposes only. This content is not intended 
              to be comprehensive or to address all possible symptoms, conditions, or treatments related 
              to back pain.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Seek Professional Medical Advice</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-900 font-semibold mb-2">You should ALWAYS:</p>
              <ul className="list-disc pl-5 space-y-2 text-blue-800">
                <li>Consult with your physician or qualified healthcare provider for medical advice</li>
                <li>Seek immediate medical attention for severe, worsening, or concerning symptoms</li>
                <li>Discuss any treatments or exercises with your healthcare provider before starting</li>
                <li>Follow your healthcare provider&apos;s recommendations over any information from this service</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Red Flag Symptoms Requiring Immediate Care</h2>
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
              <p className="text-yellow-900 font-semibold mb-2">
                Seek IMMEDIATE medical attention if you experience:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-yellow-800">
                <li>Loss of bowel or bladder control</li>
                <li>Progressive weakness in legs</li>
                <li>Numbness in the groin or genital area</li>
                <li>Severe, unrelenting pain</li>
                <li>Fever with back pain</li>
                <li>Unexplained weight loss with back pain</li>
                <li>History of cancer with new back pain</li>
                <li>Severe trauma or injury</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Limitations of Service</h2>
            <p className="text-gray-700">PainOptix:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Cannot diagnose medical conditions</li>
              <li>Cannot prescribe medications</li>
              <li>Cannot order medical tests or imaging</li>
              <li>Cannot provide specific medical treatment recommendations</li>
              <li>Cannot replace in-person medical evaluation</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Individual Results May Vary</h2>
            <p className="text-gray-700">
              The information and suggestions provided are based on general patterns and may not apply to 
              your specific situation. Every individual is unique, and what works for one person may not 
              work for another. Your healthcare provider is best equipped to provide personalized medical advice.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">No Guarantees</h2>
            <p className="text-gray-700">
              We make no guarantees about the completeness, reliability, accuracy, or suitability of the 
              information provided. The information is provided &quot;as is&quot; without warranty of any kind, either 
              express or implied.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">External Links Disclaimer</h2>
            <p className="text-gray-700">
              Our service may contain links to external websites or resources. We are not responsible for 
              the content, accuracy, or opinions expressed on these external sites, and such links should 
              not be interpreted as endorsement.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Your Responsibility</h2>
            <p className="text-gray-700">
              By using PainOptix, you acknowledge that you are responsible for your own health decisions. 
              You agree to consult with appropriate healthcare professionals before making any decisions 
              based on information from our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Contact Information</h2>
            <p className="text-gray-700">
              If you have questions about this medical disclaimer, please contact us at:
            </p>
            <address className="not-italic text-gray-700">
              PainOptix<br />
              Email: support@painoptix.com<br />
              Website: www.painoptix.com
            </address>
          </section>

          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              By using PainOptix, you acknowledge that you have read, understood, and agree to this 
              Medical Disclaimer.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center space-x-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
            Return to Home
          </Link>
          <a href="/terms" className="text-blue-600 hover:text-blue-800 underline">
            Terms of Service
          </a>
          <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  )
}