import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6 text-gray-700">
          <p className="text-sm text-gray-500">Effective Date: January 26, 2025</p>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">1. Service Description</h2>
            <p>
              PainOptix (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) provides educational information and personalized guides 
              related to back pain conditions. Our service includes an assessment tool that generates 
              educational materials based on user-provided information about symptoms and medical history.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">2. Medical Disclaimer</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-semibold text-red-900 mb-2">IMPORTANT MEDICAL DISCLAIMER:</p>
              <ul className="list-disc pl-5 space-y-2 text-red-800">
                <li>PainOptix is NOT a substitute for professional medical advice, diagnosis, or treatment</li>
                <li>Always seek the advice of your physician or qualified health provider with any questions</li>
                <li>Never disregard professional medical advice or delay seeking it because of something you read here</li>
                <li>If you think you have a medical emergency, call 911 or your local emergency number immediately</li>
                <li>No doctor-patient relationship is created through use of this service</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">3. User Responsibilities</h2>
            <p>By using our service, you agree to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide accurate and complete information during assessments</li>
              <li>Use the service only for lawful purposes</li>
              <li>Not rely solely on our educational materials for medical decisions</li>
              <li>Consult with healthcare professionals for medical advice</li>
              <li>Be at least 18 years old or have parental consent</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">4. Payment Terms</h2>
            <p>
              PainOptix offers different tiers of educational guides:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Free Basic Guide: No charge</li>
              <li>Enhanced Guide: $14.95 (one-time payment)</li>
              <li>Comprehensive Guide: $34.95 (one-time payment)</li>
            </ul>
            <p className="mt-3">
              All payments are processed securely through Stripe. Prices are in USD and include all applicable taxes. 
              Refunds may be available within 30 days of purchase at our discretion.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">5. Intellectual Property</h2>
            <p>
              All content, including text, graphics, logos, and educational materials, is the property of 
              PainOptix and Bradley W. Carpentier, MD. You may not reproduce, distribute, or create 
              derivative works without explicit written permission.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">6. HIPAA Compliance</h2>
            <p>
              We are committed to protecting your health information. While we follow HIPAA security 
              standards and best practices, please note that our educational service may not be 
              subject to all HIPAA requirements. We encrypt all data transmission and storage, and 
              limit access to your information to authorized personnel only.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">7. Data Use and Research</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-900">
                By submitting data to Paincrowdsource.org, you agree to its use in an anonymized form to 
                advance pain management research, improve AI-driven tools like PainFinder, and potentially 
                support platform development or licensing. No personal information is collected unless you 
                voluntarily provide email/SMS via Twilio to access, update, or delete your data using the 
                &apos;Delete My Data&apos; option. For details, contact DrcPainMD.com
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">8. Limitation of Liability</h2>
            <p className="font-semibold">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, PAINOPTIX SHALL NOT BE LIABLE FOR ANY INDIRECT, 
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, 
              WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER 
              INTANGIBLE LOSSES.
            </p>
            <p>
              Our total liability shall not exceed the amount you paid for our services in the past 12 months.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">9. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless PainOptix, its affiliates, and their respective 
              officers, directors, employees, and agents from any claims, damages, or expenses arising 
              from your use of the service or violation of these terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">10. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the United 
              States and the State of [Your State], without regard to its conflict of law provisions. 
              Any disputes shall be resolved in the courts located in [Your County], [Your State].
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of material 
              changes via email or through the service. Your continued use after changes constitutes 
              acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">12. Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us at:
            </p>
            <address className="not-italic">
              PainOptix<br />
              Email: support@painoptix.com<br />
              Website: www.painoptix.com
            </address>
          </section>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  )
}