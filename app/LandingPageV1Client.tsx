"use client"

import Link from 'next/link'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Activity, ArrowRight, Shield, Award, CheckCircle, Clock } from 'lucide-react'

import { isPilot } from '@/lib/pilot'

export function LandingPageV1Client() {
  const router = useRouter()
  const [recentAssessment, setRecentAssessment] = useState<any>(null)

  // Check for recent assessment on component mount
  useState(() => {
    if (typeof window !== 'undefined') {
      const recent = localStorage.getItem('recentAssessment')
      if (recent) {
        try {
          const data = JSON.parse(recent)
          const hoursSince = (Date.now() - new Date(data.completedAt).getTime()) / (1000 * 60 * 60)
          if (hoursSince < 24) {
            setRecentAssessment(data)
          }
        } catch (e) {
          // Invalid data, clear it
          localStorage.removeItem('recentAssessment')
        }
      }
    }
  })

  const handleStartAssessment = useCallback((e: React.MouseEvent) => {
    e.preventDefault()

    if (typeof window !== 'undefined') {
      const recent = localStorage.getItem('recentAssessment')
      if (recent) {
        try {
          const data = JSON.parse(recent)
          const hoursSince = (Date.now() - new Date(data.completedAt).getTime()) / (1000 * 60 * 60)

          if (hoursSince < 24) {
            // Redirect to their assessments instead
            router.push('/my-assessments')
            return
          }
        } catch (e) {
          // Invalid data, proceed normally
        }
      }
    }

    // Otherwise proceed normally
    const target = isPilot() ? '/test-assessment?src=homepage_pilot' : '/test-assessment'
    router.push(target)
  }, [router])

  const ctaSection = (
    <section id="start-check" className="py-24 bg-gradient-to-b from-gray-50/50 to-white">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-light text-gray-900 mb-4">
          Ready to Start?
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Get your personalized plan in just 2 minutes
        </p>
        <button onClick={handleStartAssessment} className="inline-flex px-8 py-3 bg-[#0B5394] text-white text-lg font-medium rounded shadow-sm hover:bg-[#084074] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
          Start Free Check
          <ArrowRight className="inline-block ml-2 w-5 h-5" />
        </button>
        <p className="mt-4 text-sm text-gray-500">
          Delivered instantly by text. No payment required.
        </p>
      </div>
    </section>
  )

  return (
    <>
      {/* Medical Header */}
      <header className="relative z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-[#0B5394]" />
              <span className="text-xl font-medium text-gray-900">PainOptix™</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#how-it-works"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('how-it-works')?.scrollIntoView({
                    behavior: 'smooth'
                  });
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              >
                How it works
              </a>
              <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
                About
              </Link>
              <button onClick={handleStartAssessment} className="px-6 py-2 bg-[#0B5394] text-white font-medium rounded hover:bg-[#084074] transition-colors">
                Start Assessment
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Medical Authority Hero Section */}
      <section className="relative min-h-[700px] bg-white flex items-center">
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center">

          {/* Main headline - refined medical typography */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight text-gray-900 leading-[1.1]" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
            Make Sense of Your
            <span className="block text-[#0B5394] font-light">Back Pain.</span>
            <span className="block text-gray-900">Fast!</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Take a free, two-minute educational check to see which back-pain type most closely matches your symptoms.
            We&apos;ll text your personalized plan instantly. No payment required.
          </p>

          {/* CTA Section */}
          <div className="mt-10">
            <button onClick={handleStartAssessment} className="inline-flex px-8 py-3 bg-[#0B5394] text-white text-lg font-medium rounded shadow-sm hover:bg-[#084074] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
              Start Free Check
              <ArrowRight className="inline-block ml-2 w-5 h-5" />
            </button>

            {/* Disclaimer - clear and visible */}
            <p className="mt-4 text-sm text-gray-600">
              PainFinder™ provides educational content only. Not a diagnostic tool.
            </p>

            {recentAssessment && (
              <p className="mt-2 text-sm text-gray-600">
                Recently completed an assessment? <Link href="/my-assessments" className="text-blue-600 hover:text-blue-700 underline">View your results</Link>
              </p>
            )}

          </div>
        </div>
      </section>

      {/* Trust Indicators - Clean Design */}
      <div className="relative -mt-24 z-30 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row justify-around items-center space-y-6 md:space-y-0">
              {/* 16 Questions */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                  <span className="text-2xl font-semibold text-[#0B5394]">16</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Clinical Questions</h3>
                <p className="text-sm text-gray-600">Based on proven medical guidelines</p>
              </div>

              {/* 9 Conditions */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                  <span className="text-2xl font-semibold text-[#0B5394]">9</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Pain Conditions</h3>
                <p className="text-sm text-gray-600">Comprehensive coverage</p>
              </div>

              {/* MD Designed */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                  <Award className="w-8 h-8 text-[#0B5394]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Physician Designed</h3>
                <p className="text-sm text-gray-600">Medical expertise</p>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Modern Disclaimer */}
      <div className="border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <p className="text-sm text-gray-600 text-center">
            <strong>Note:</strong> PainFinder™ provides educational content only and is not a diagnostic tool.
            Always consult healthcare professionals for medical advice.
          </p>
        </div>
      </div>


      {/* Medical Process Section */}
      <section id="how-it-works" className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              A Simple, Three-Step Process
            </h2>
            <div className="w-16 h-px bg-[#0B5394] mx-auto"></div>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="space-y-16">
              {/* Step 1 */}
              <div className="flex items-start gap-8 group">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center group-hover:border-[#0B5394] transition-colors duration-300">
                    <span className="text-lg font-light text-gray-600 group-hover:text-[#0B5394] transition-colors">1</span>
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Complete Assessment</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Answer 16 clinically-validated questions about your symptoms, pain patterns, and medical history.
                    Our assessment uses evidence-based protocols developed by medical professionals.
                  </p>
                </div>
              </div>

              {/* Connecting line */}
              <div className="ml-6 -my-12">
                <div className="w-px h-16 bg-gradient-to-b from-gray-200 to-transparent ml-0"></div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-8 group">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center group-hover:border-[#0B5394] transition-colors duration-300">
                    <span className="text-lg font-light text-gray-600 group-hover:text-[#0B5394] transition-colors">2</span>
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Receive Your Plan Instantly</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Get a comprehensive personalized guide delivered directly to your phone by secure text message.
                    Includes exercises, management strategies, and a 14-day follow-up plan.
                  </p>
                </div>
              </div>

              {/* Connecting line */}
              <div className="ml-6 -my-12">
                <div className="w-px h-16 bg-gradient-to-b from-gray-200 to-transparent ml-0"></div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-8 group">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center group-hover:border-[#0B5394] transition-colors duration-300">
                    <span className="text-lg font-light text-gray-600 group-hover:text-[#0B5394] transition-colors">3</span>
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Take Informed Action</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Use your guide&apos;s evidence-based recommendations to make informed decisions
                    about your care and discuss options with your healthcare provider.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Medical Authority Doctor Section */}
      <section className="py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 mb-4">Created by a Physician</h2>
            <div className="w-16 h-px bg-[#0B5394] mx-auto"></div>
          </div>

          <div className="bg-gray-50 rounded-lg p-12 shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
            <div className="text-center">
              {/* Clean professional presentation */}
              <div className="mb-8">
                <div className="w-32 h-32 rounded-full bg-gray-100 mx-auto mb-6 flex items-center justify-center">
                  <span className="text-4xl font-light text-gray-600">BC</span>
                </div>

                <h3 className="text-2xl font-medium text-gray-900 mb-2">Bradley W. Carpentier, MD</h3>
                <p className="text-gray-600 mb-6">Board Certified Physician</p>

                {/* Professional credentials - clean text */}
                <div className="flex flex-wrap gap-6 justify-center text-sm text-gray-600">
                  <span>Board Certified</span>
                  <span>•</span>
                  <span>Pain Management Specialist</span>
                  <span>•</span>
                  <span>Published Researcher</span>
                </div>
              </div>

              {/* Professional quote */}
              <div className="max-w-3xl mx-auto">
                <blockquote className="text-lg text-gray-700 italic leading-relaxed">
                  &quot;With extensive experience in treating musculoskeletal conditions,
                  Dr. Carpentier developed PainOptix to bridge the gap between
                  clinical expertise and patient education.&quot;
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Medical CTA Section */}
      {ctaSection}

      {/* Soft Footer - Clementine Style */}
      <footer className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-6 h-6 text-[#0B5394]" />
                <span className="text-lg font-medium text-gray-900">PainOptix™</span>
              </div>
              <p className="text-gray-600 text-sm">
                Professional back pain assessment designed by medical experts.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={handleStartAssessment} className="text-gray-600 hover:text-gray-900 text-left">Start Assessment</button></li>
                <li><a
                  href="#how-it-works"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('how-it-works')?.scrollIntoView({
                      behavior: 'smooth'
                    });
                  }}
                  className="text-gray-600 hover:text-gray-900 cursor-pointer"
                >How It Works</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-gray-600 hover:text-gray-900">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-600 hover:text-gray-900">Terms of Service</Link></li>
                <li><Link href="/disclaimer" className="text-gray-600 hover:text-gray-900">Medical Disclaimer</Link></li>
                <li><Link href="/delete-my-data" className="text-gray-600 hover:text-gray-900">Delete My Data</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-600">
                © {new Date().getFullYear()} PainOptix™. All rights reserved.
              </p>
              <div className="flex gap-6">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span>FDA Compliant</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Lock className="w-4 h-4 text-gray-400" />
                  <span>HIPAA Secure</span>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Disclaimer */}
          <div className="mt-8 p-6 rounded-lg bg-white border border-gray-200">
            <p className="text-xs text-gray-600 leading-relaxed">
              <strong>Medical Disclaimer:</strong> PainFinder™ does not diagnose medical conditions or recommend specific treatments.
              A complete diagnosis requires a physical exam, imaging, or other testing — symptoms alone are not enough.
              <Link href="/about" className="text-blue-600 hover:text-blue-700 underline">Learn more about what a full diagnosis involves</Link>.
              Your result reflects a common symptom pattern that matches your questionnaire responses.
              It is provided for wellness education and informational purposes only.
              Please consult a licensed healthcare provider for a full evaluation.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
