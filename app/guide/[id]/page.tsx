'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowRight, Star, Zap, BookOpen, Download, Shield, CheckCircle, Award, Clock, Activity, MapPin, AlertCircle, Info } from 'lucide-react'
import { GuideContent } from './GuideContent'
import { formatAssessmentResponses } from '@/lib/assessment-formatter'
import { isHighestTier, getTierDisplayName, mapDbTierToUrl } from '@/lib/utils/tier-mapping'
import UserDeleteModal from '@/components/UserDeleteModal'

interface Assessment {
  id: string
  guide_type: string
  disclosures: string[]
  created_at: string
  payment_tier: number | string | null
  initial_pain_score: number
  responses?: any[]
  email?: string | null
  phone_number?: string | null
}

export default function GuidePage() {
  const params = useParams()
  const router = useRouter()
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  useEffect(() => {
    async function loadAssessment() {
      try {
        // Loading guide for assessment
        
        // TEMPORARY: Use API route to bypass RLS
        const response = await fetch(`/api/assessment/${params.id}`)
        const result = await response.json()
        
        // API response received
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Assessment not found')
          }
          throw new Error(result.error || 'Failed to load assessment')
        }
        
        setAssessment(result.assessment)
        
        // Check if coming from successful payment
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search)
          if (urlParams.get('payment') === 'success' && result.assessment) {
            // Store recent assessment data
            localStorage.setItem('recentAssessment', JSON.stringify({
              id: result.assessment.id,
              completedAt: new Date().toISOString(),
              email: result.assessment.email || '',
              guideType: result.assessment.guide_type
            }))
          }
        }
        
        // Mark as opened using service role through API
        await fetch('/api/assessment/route', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: params.id,
            guide_opened_at: new Date().toISOString()
          })
        })
          
      } catch (err: any) {
        console.error('Error loading assessment')
        setError(err.message || 'Guide not found')
      } finally {
        setLoading(false)
      }
    }

    loadAssessment()
  }, [params.id])

  const handleDeleteData = async () => {
    try {
      const response = await fetch(`/api/user-delete-data`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId: params.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete data')
      }

      setShowDeleteModal(false)
      setDeleteSuccess(true)
      
      // Redirect to homepage after 3 seconds
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (error) {
      console.error('Error deleting data:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete data')
    }
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (error || !assessment) return <div className="p-8">Error: {error}</div>
  
  // Show success message if data was deleted
  if (deleteSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your data has been deleted</h2>
          <p className="text-gray-600">Redirecting to homepage...</p>
        </div>
      </div>
    )
  }

  const guideTitle = assessment.guide_type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  // Determine tier display info
  const tierInfo = (assessment.payment_tier && isHighestTier(String(assessment.payment_tier))) || assessment.payment_tier === 20 ? {
    name: 'Comprehensive Monograph',
    color: 'purple',
    badge: 'PREMIUM',
    icon: BookOpen
  } : assessment.payment_tier === 'enhanced' || assessment.payment_tier === 5 ? {
    name: 'Enhanced Report',
    color: 'blue',
    badge: 'ENHANCED',
    icon: Zap
  } : {
    name: 'Basic Guide',
    color: 'gray',
    badge: 'FREE',
    icon: Star
  };

  // Displaying content based on payment tier

  // Format assessment responses for display
  const formattedResponses = assessment.responses ? formatAssessmentResponses(assessment.responses) : [];

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.01]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%230B5394' fill-opacity='1'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>
      
      {/* Premium Header */}
      <div className="relative bg-gradient-to-r from-[#0B5394] to-[#084074] text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-5xl mx-auto px-6 py-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-full mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-white">Your Educational Guide</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
            {guideTitle}
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Doctor attribution with white text */}
            <div className="inline-flex items-center bg-white/10 backdrop-blur text-white px-6 py-3 rounded-lg shadow-lg border border-white/20">
              <span className="font-semibold">Designed by Bradley W. Carpentier, MD</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-full">
              <tierInfo.icon className="w-4 h-4 text-white" />
              <span className="text-sm font-bold text-white">{tierInfo.badge} EDITION</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
      
        {/* Medical Authority Card */}
        <div className="bg-white shadow-xl rounded-2xl p-8 mb-8 border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-[#0B5394]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Medical Disclaimer</h2>
              <p className="text-gray-700 leading-relaxed">
                PainFinder™ does not diagnose medical conditions or recommend specific treatments. 
                A complete diagnosis requires a physical exam, imaging, or other testing — symptoms alone are not enough. 
                <Link href="/about-painfinder" className="text-blue-600 hover:text-blue-700 underline">Learn more about what a full diagnosis involves</Link>. 
                Your result reflects a common symptom pattern that matches your questionnaire responses. 
                It is provided for wellness education and informational purposes only. 
                Please consult a licensed healthcare provider for a full evaluation.
              </p>
            </div>
          </div>
        </div>

        {/* Assessment Summary Card */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-[#0B5394] to-[#084074] px-8 py-6">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-white" />
              <h2 className="text-2xl font-normal text-white">Your Assessment Summary</h2>
            </div>
          </div>
          
          <div className="p-8">
            {/* Pain Score Display */}
            <div className="mb-8 p-6 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-700 font-medium">Initial Pain Level</span>
                <span className="text-2xl font-bold text-gray-900">{assessment.initial_pain_score}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full transition-all duration-1000 ease-out rounded-full"
                  style={{ 
                    width: `${(assessment.initial_pain_score / 10) * 100}%`,
                    background: assessment.initial_pain_score <= 3 ? '#10b981' : 
                               assessment.initial_pain_score <= 6 ? '#f59e0b' : '#ef4444'
                  }}
                />
              </div>
            </div>
            
            {/* Formatted Responses */}
            {formattedResponses.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 mb-4">Your Responses</h3>
                <div className="grid gap-4">
                  {formattedResponses.map((item, index) => {
                    // Select icon based on category
                    const IconComponent = 
                      item.icon === 'location' ? MapPin :
                      item.icon === 'activity' ? Activity :
                      item.icon === 'clock' ? Clock :
                      item.icon === 'alert' ? AlertCircle :
                      Info;
                    
                    return (
                      <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                          <IconComponent className="w-5 h-5 text-[#0B5394]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600 mb-1">{item.question}</p>
                          <p className="text-gray-900 font-medium">{item.answer}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Fallback to disclosures if no responses */
              <div className="space-y-3">
                {assessment.disclosures.map((disclosure, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#0B5394] rounded-full mt-2 flex-shrink-0" />
                    <p className="text-gray-700 leading-relaxed">{disclosure}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white shadow-xl rounded-2xl p-8 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-[#0B5394]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">About {guideTitle}</h2>
          </div>
          <p className="text-gray-700 leading-relaxed mb-4">
            This educational guide provides {tierInfo.name === 'Basic Guide' ? 'general' : 'comprehensive'} information about {guideTitle.toLowerCase()} 
            based on your responses and Bradley W. Carpentier, MD&apos;s clinical expertise.
          </p>
        
        {assessment.guide_type === 'urgent_symptoms' && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-6 mb-6">
            <h3 className="font-bold text-red-900 text-lg mb-3">⚠️ How Your Input Relates</h3>
            <p className="text-red-800 mb-3">
              You indicated one or more of the following: difficulty controlling bladder or bowels, numbness in 
              groin or inner thighs, new or worsening leg weakness, or concerns like unexplained weight loss, fever, or 
              a history of cancer. These symptoms are associated with potentially serious conditions.
            </p>
            <p className="font-semibold text-red-900">
              If you have noticed symptoms like these, medical guidelines suggest you consider talking to a doctor 
              promptly [Chou et al., 2007; Downie et al., 2013]. Please contact your healthcare provider or 
              emergency services immediately.
            </p>
          </div>
        )}
        
        {/* Show upgrade options based on current tier */}
        {(!assessment.payment_tier || assessment.payment_tier === 0 || assessment.payment_tier === 'free') && (
          <div className="mt-8 space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Unlock More Detailed Information</h3>
              <p className="text-gray-600">Get educational strategies and expert guidance</p>
            </div>
            
            {/* Enhanced Report Upgrade */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  28% OFF!
                </span>
              </div>
              <div className="flex items-start gap-4">
                <Zap className="w-10 h-10 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-xl font-bold mb-2">Enhanced Report - Only $5 <span className="line-through text-gray-500 text-base">$7</span></h4>
                  <ul className="text-sm text-gray-700 space-y-1 mb-4">
                    <li>• Detailed exercise illustrations</li>
                    <li>• 7-day management plan</li>
                    <li>• Posture correction guide</li>
                    <li>• Progress tracking tools</li>
                  </ul>
                  <button 
                    onClick={() => router.push(`/guide/${params.id}/upgrade?tier=enhanced`)}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all transform hover:scale-105 inline-flex items-center gap-2"
                  >
                    Get Enhanced Report Now <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Monograph Upgrade */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl p-6 relative">
              <div className="absolute top-2 right-2">
                <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  MOST COMPREHENSIVE
                </span>
              </div>
              <div className="flex items-start gap-4">
                <BookOpen className="w-10 h-10 text-purple-600 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-xl font-bold mb-2">Complete Monograph - $20</h4>
                  <ul className="text-sm text-gray-700 space-y-1 mb-4">
                    <li>• Everything in Enhanced Report</li>
                    <li>• Medical research references</li>
                    <li>• Management approach comparison charts</li>
                    <li>• 14-day management roadmap</li>
                    <li>• Provider discussion guide</li>
                  </ul>
                  <button 
                    onClick={() => router.push(`/guide/${params.id}/upgrade?tier=monograph`)}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all transform hover:scale-105 inline-flex items-center gap-2"
                  >
                    Get Complete Monograph <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* For $5 users, show monograph upgrade */}
        {(assessment.payment_tier === 5 || assessment.payment_tier === 'enhanced') && (
          <div className="mt-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Upgrade to Complete Monograph</h3>
              <p className="text-gray-600">Get the most comprehensive guide with medical research</p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <BookOpen className="w-10 h-10 text-purple-600 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-xl font-bold mb-2">Complete Monograph - Only $20</h4>
                  <p className="text-gray-700 mb-3">You already have the Enhanced Report. Upgrade to get:</p>
                  <ul className="text-sm text-gray-700 space-y-1 mb-4">
                    <li>• In-depth medical research and references</li>
                    <li>• Comprehensive management approach comparison</li>
                    <li>• Long-term management strategies</li>
                    <li>• Professional provider discussion points</li>
                  </ul>
                  <button 
                    onClick={() => router.push(`/guide/${params.id}/upgrade?tier=monograph`)}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all transform hover:scale-105 inline-flex items-center gap-2"
                  >
                    Upgrade to Monograph <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

        {/* Dynamic Guide Content Based on Tier */}
        <GuideContent 
          guideType={assessment.guide_type}
          tier={
            (assessment.payment_tier && isHighestTier(String(assessment.payment_tier))) || assessment.payment_tier === 20 ? 'monograph' :
            assessment.payment_tier === 'enhanced' || assessment.payment_tier === 5 ? 'enhanced' :
            'free'
          }
        />

        {/* Premium PDF Download Section */}
        <div className="medical-card shadow-xl rounded-2xl p-8 mb-8 bg-gradient-to-br from-white to-gray-50">
          <div className="flex items-center gap-3 mb-6">
            <Download className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Download Your Guide</h2>
          </div>
          
          <div className="space-y-4">
            {/* Show appropriate download based on payment tier */}
            {((assessment.payment_tier && isHighestTier(String(assessment.payment_tier))) || assessment.payment_tier === 20) ? (
              <button
                onClick={() => window.location.href = `/api/download-guide?id=${assessment.id}&tier=monograph`}
                className="group relative w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 
                  text-white rounded-2xl font-medium hover:scale-[1.02] transition-all duration-300 
                  shadow-xl hover:shadow-2xl flex items-center justify-between"
              >
                <div className="text-left">
                  <div className="text-lg font-bold">Comprehensive Monograph (PDF)</div>
                  <div className="text-sm opacity-90">Complete medical reference with research citations</div>
                </div>
                <Download className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
              </button>
            ) : (assessment.payment_tier === 'enhanced' || assessment.payment_tier === 5) ? (
              <button
                onClick={() => window.location.href = `/api/download-guide?id=${assessment.id}&tier=enhanced`}
                className="group relative w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 
                  text-white rounded-2xl font-medium hover:scale-[1.02] transition-all duration-300 
                  shadow-xl hover:shadow-2xl flex items-center justify-between"
              >
                <div className="text-left">
                  <div className="text-lg font-bold">Enhanced Report (PDF)</div>
                  <div className="text-sm opacity-90">Detailed guide with exercises and recovery plan</div>
                </div>
                <Download className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
              </button>
            ) : (
              <button
                onClick={() => window.location.href = `/api/download-guide?id=${assessment.id}&tier=free`}
                className="group relative w-full px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 
                  text-white rounded-2xl font-medium hover:scale-[1.02] transition-all duration-300 
                  shadow-xl hover:shadow-2xl flex items-center justify-between"
              >
                <div className="text-left">
                  <div className="text-lg font-bold">Basic Educational Guide (PDF)</div>
                  <div className="text-sm opacity-90">General information about your condition</div>
                </div>
                <Download className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
              </button>
            )}
          </div>
          
          {/* Show what's included in their tier */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Your {tierInfo.name} includes:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tierInfo.name === 'Comprehensive Monograph' ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>30+ pages of medical content</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Research citations & references</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Management approach comparison charts</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Provider discussion guide</span>
                  </div>
                </>
              ) : tierInfo.name === 'Enhanced Report' ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>15+ pages of content</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Exercise illustrations</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>7-day management plan</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Progress tracking tools</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>5+ pages of content</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Basic information</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>General exercises</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Self-care tips</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="medical-card shadow-xl rounded-2xl p-8 bg-gradient-to-br from-blue-50 to-white">
          <div className="text-center">
            <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">We Care About Your Progress</h3>
            <p className="text-gray-700 mb-6">
              We&apos;ll check in with you in 14 days to see how you&apos;re doing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Delete My Data
              </button>
            </div>
          </div>
          
          {/* Final medical disclaimer */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              The information provided here is not a substitute for medical care. 
              If your symptoms worsen or fail to improve, seek evaluation by a licensed provider.
            </p>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <UserDeleteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteData}
          assessmentId={assessment.id}
          userEmail={assessment.email}
          userPhone={assessment.phone_number}
        />
      </div>
    </div>
  )
}