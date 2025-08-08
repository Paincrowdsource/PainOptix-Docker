import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6 text-gray-700">
          <p className="text-sm text-gray-500">Effective Date: January 26, 2025</p>
          <p className="text-sm text-gray-500">Last Updated: January 26, 2025</p>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Introduction</h2>
            <p>
              PainOptix (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy and personal health 
              information. This Privacy Policy explains how we collect, use, disclose, and safeguard your 
              information when you use our back pain assessment service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Information We Collect</h2>
            <h3 className="text-xl font-semibold text-gray-800">Personal Information</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Name (first and last)</li>
              <li>Email address</li>
              <li>Phone number (optional)</li>
              <li>Age</li>
              <li>Gender</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-4">Health Information</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Assessment responses about back pain symptoms</li>
              <li>Pain severity scores</li>
              <li>Medical history related to back pain</li>
              <li>Physical activity and lifestyle information</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-4">Technical Information</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Generate personalized educational guides based on your assessment</li>
              <li>Send your assessment results via email or SMS</li>
              <li>Follow up with educational information (14-day follow-up)</li>
              <li>Process payments for enhanced or comprehensive guides</li>
              <li>Improve our assessment algorithm and educational content</li>
              <li>Conduct anonymized research through PainCrowdsource (paid users only, with consent)</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">HIPAA Compliance</h2>
            <p>
              We implement administrative, physical, and technical safeguards to protect your health 
              information in accordance with HIPAA security standards:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Access controls and authentication measures</li>
              <li>Regular security assessments and audits</li>
              <li>Employee training on data protection</li>
              <li>Business Associate Agreements with third-party services</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Data Sharing and Disclosure</h2>
            <p>We may share your information with:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Service Providers:</strong> Including Stripe (payments), SendGrid (email), and cloud hosting services</li>
              <li><strong>PainCrowdsource:</strong> Paid users are automatically enrolled for research purposes (anonymized data only)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with any merger, sale, or acquisition</li>
            </ul>
            <p className="mt-3 font-semibold">
              We NEVER sell your personal or health information to third parties.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Data Retention</h2>
            <p>
              We retain your information for as long as necessary to provide our services and comply with 
              legal obligations:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Assessment data: Retained indefinitely for research purposes (anonymized)</li>
              <li>Personal contact information: Until you request deletion</li>
              <li>Payment information: As required by financial regulations (typically 7 years)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Your Rights and Choices</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Request corrections to inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your data (use our &quot;Delete My Data&quot; feature)</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Data Portability:</strong> Receive your data in a structured format</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Maintain session state during assessments</li>
              <li>Analyze usage patterns and improve our service</li>
              <li>Remember your preferences</li>
            </ul>
            <p className="mt-3">
              You can control cookies through your browser settings, but disabling them may affect 
              functionality.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Third-Party Services</h2>
            <p>Our service integrates with:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Stripe:</strong> Payment processing (PCI compliant)</li>
              <li><strong>SendGrid:</strong> Email delivery</li>
              <li><strong>Supabase:</strong> Database and authentication</li>
              <li><strong>Vercel:</strong> Hosting and analytics</li>
            </ul>
            <p className="mt-3">
              These services have their own privacy policies and data practices.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Children&apos;s Privacy</h2>
            <p>
              Our service is not intended for children under 18. We do not knowingly collect information 
              from children. If you believe we have collected information from a child, please contact us 
              immediately.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. We 
              ensure appropriate safeguards are in place for such transfers.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Data Security</h2>
            <p>
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>TLS/SSL encryption for all data transmission</li>
              <li>Encrypted database storage</li>
              <li>Regular security updates and patches</li>
              <li>Limited access to personal information</li>
              <li>Incident response procedures</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of material changes via 
              email or through our service. Your continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Contact Us</h2>
            <p>
              For privacy-related questions or to exercise your rights, contact us at:
            </p>
            <address className="not-italic">
              PainOptix Privacy Officer<br />
              Email: privacy@painoptix.com<br />
              Phone: [Your Phone Number]<br />
              Address: [Your Business Address]
            </address>
            
            <p className="mt-4">
              To delete your data, visit: <a href="/delete-my-data" className="text-blue-600 hover:text-blue-800 underline">Delete My Data</a>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">California Privacy Rights</h2>
            <p>
              California residents have additional rights under the CCPA, including the right to know what 
              personal information is collected, used, shared, or sold. Contact us to exercise these rights.
            </p>
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