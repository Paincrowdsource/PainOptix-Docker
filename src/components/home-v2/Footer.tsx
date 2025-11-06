"use client"

import Link from 'next/link'
import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, Shield, Lock } from 'lucide-react'

type FooterProps = {
  startHref: string
}

export function Footer({ startHref }: FooterProps) {
  const router = useRouter()

  const handleStartAssessment = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    router.push(startHref)
  }, [router, startHref])

  return (
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
  )
}
