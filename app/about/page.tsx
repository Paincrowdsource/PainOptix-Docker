'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { Activity, Lock, Shield } from 'lucide-react'

export default function AboutPainFinder() {
  const router = useRouter()
  
  const handleStartAssessment = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    
    if (typeof window !== 'undefined') {
      const recent = localStorage.getItem('recentAssessment')
      if (recent) {
        try {
          const data = JSON.parse(recent)
          const hoursSince = (Date.now() - new Date(data.completedAt).getTime()) / (1000 * 60 * 60)
          
          if (hoursSince < 24) {
            router.push('/my-assessments')
            return
          }
        } catch (e) {
          // Invalid data, proceed normally
        }
      }
    }
    
    router.push('/test-assessment')
  }, [router])
  
  return (
    <div className="min-h-screen bg-white">
      {/* Medical Header - Same as homepage */}
      <header className="relative z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-[#0B5394]" />
              <span className="text-xl font-medium text-gray-900">PainOptix™</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-8">
              <Link 
                href="/#how-it-works" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                How it works
              </Link>
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

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          What PainFinder™ Is — And What It Isn&apos;t
        </h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-700 mb-6">
            At PainOptix™, we believe in being transparent about how our tools work — and what their limitations are.
          </p>
          
          <p className="text-gray-700 mb-6">
            PainFinder™ is not a diagnostic tool. It&apos;s a symptom-pattern exploration system designed to help you recognize common pain patterns and begin understanding possible sources of your pain. While it may feel accurate — and often aligns with what a physician might suspect early on — it does not replace clinical diagnosis.
          </p>
          
          <p className="text-gray-700 font-semibold mb-4">Here&apos;s why:</p>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            How a Real Diagnosis Happens
          </h2>
          
          <p className="text-gray-700 mb-4">
            As a physician, my diagnostic process involves multiple steps:
          </p>
          
          <div className="space-y-6 mb-8">
            <div>
              <h3 className="text-xl font-semibold text-[#0B5394] mb-2">
                Symptom Pattern Recognition
              </h3>
              <p className="text-gray-700">
                I begin by reviewing your symptom story — where the pain is, what it feels like (burning, stabbing, aching), what makes it worse or better, and when it tends to occur. This gives me a differential diagnosis — a list of possible causes.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-[#0B5394] mb-2">
                Physical Examination
              </h3>
              <p className="text-gray-700">
                I then examine you directly. This includes detailed musculoskeletal and neurological testing to confirm or challenge the initial pattern.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-[#0B5394] mb-2">
                Imaging and Targeted Testing
              </h3>
              <p className="text-gray-700">
                I may order MRIs, nerve tests, or perform diagnostic injections to gather hard evidence. These tests help refine the diagnosis.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-[#0B5394] mb-2">
                Therapeutic Confirmation
              </h3>
              <p className="text-gray-700">
                Even then, I don&apos;t consider the diagnosis confirmed until a treatment relieves the symptom or sign — that&apos;s the final test.
              </p>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            What PainFinder™ Actually Does
          </h2>
          
          <p className="text-gray-700 mb-4">
            PainFinder simulates the first step of this process:
          </p>
          
          <ul className="list-disc list-inside space-y-2 mb-6 text-gray-700">
            <li>It listens to your symptom report</li>
            <li>It maps that report to known pain patterns</li>
            <li>It shows you which pattern your symptoms most closely resemble</li>
            <li>It offers general educational guidance about that pattern</li>
          </ul>
          
          <p className="text-gray-700 font-semibold mb-2">It does not:</p>
          
          <ul className="list-disc list-inside space-y-2 mb-8 text-gray-700">
            <li>Perform a physical exam</li>
            <li>Interpret imaging</li>
            <li>Order or respond to diagnostic injections</li>
            <li>Confirm whether a treatment actually works for you</li>
          </ul>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            What That Means for You
          </h2>
          
          <p className="text-gray-700 mb-4">
            PainFinder is meant to give you a starting point — not a final answer.
          </p>
          
          <p className="text-gray-700 mb-4">
            It helps you explore what might be going on, based on common symptom patterns. That&apos;s valuable. But by design, it cannot tell you what&apos;s actually wrong.
          </p>
          
          <p className="text-gray-700 font-semibold mb-2">Because real diagnosis requires:</p>
          
          <ul className="list-disc list-inside space-y-2 mb-6 text-gray-700">
            <li>Touch</li>
            <li>Imaging</li>
            <li>Clinical judgment</li>
            <li>And response to treatment</li>
          </ul>
          
          <p className="text-gray-700 mb-6">
            PainFinder provides an educated guess, not a confirmed cause. It&apos;s the first step in a longer process — one that ideally continues in conversation with a medical doctor who can complete the full workup.
          </p>
          
          <p className="text-gray-700 font-semibold">
            This tool is here to help you think clearly about your pain, not to name it with certainty.
          </p>
          
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Bradley W. Carpentier, MD
            </p>
          </div>
        </div>
      </div>

      {/* Soft Footer - Same as homepage */}
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
                <li><Link 
                  href="/#how-it-works" 
                  className="text-gray-600 hover:text-gray-900"
                >How It Works</Link></li>
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
    </div>
  );
}