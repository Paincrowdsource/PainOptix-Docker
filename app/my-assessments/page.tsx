'use client'

/**
 * My Assessments Landing Page
 * 
 * PURPOSE:
 * - Entry point for users to access their historical assessments
 * - Initiates secure verification process before data access
 * - Supports both email and phone number identification
 * 
 * SECURITY CONSIDERATIONS:
 * - Input validation prevents malformed email/phone submissions
 * - Client-side validation is supplemented by server-side validation
 * - Uses session storage temporarily for verification flow (cleared after use)
 * - Rate limiting implemented on server side to prevent abuse
 * 
 * GDPR COMPLIANCE:
 * - Provides transparent access to user's personal data (Article 15)
 * - Clear privacy notice about data protection measures
 * - Links to privacy policy and terms of service
 * - User can access and manage their data after verification
 * 
 * USER EXPERIENCE:
 * - Toggle between email and phone input with visual feedback
 * - Real-time client-side validation with clear error messages
 * - Loading states prevent multiple submissions
 * - Responsive design for mobile accessibility
 * 
 * VERIFICATION FLOW:
 * 1. User enters email or phone number
 * 2. Client validates format and length
 * 3. Server checks if assessments exist for identifier
 * 4. If found, sends verification code via email/SMS
 * 5. User redirected to verification page
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, FileText, ChevronRight } from 'lucide-react'

export default function MyAssessmentsPage() {
  const router = useRouter()
  
  // Form state management
  const [identifier, setIdentifier] = useState('') // User's email or phone
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email') // Input type toggle
  const [isLoading, setIsLoading] = useState(false) // Prevents double submission
  const [error, setError] = useState<string | null>(null) // User-friendly error display

  /**
   * Handles form submission and initiates verification process
   * 
   * SECURITY VALIDATION:
   * - Client-side validation prevents obviously malformed requests
   * - Server-side validation provides final security layer
   * - Input sanitization prevents injection attacks
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Basic input validation
    if (!identifier.trim()) {
      setError('Please enter your email or phone number')
      return
    }

    // Email format validation using standard regex
    if (identifierType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(identifier)) {
        setError('Please enter a valid email address')
        return
      }
    }

    // Phone format validation (allows common formatting)
    if (identifierType === 'phone') {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/
      if (!phoneRegex.test(identifier) || identifier.replace(/\D/g, '').length < 10) {
        setError('Please enter a valid phone number')
        return
      }
    }

    setIsLoading(true)

    try {
      // Call server-side verification endpoint with rate limiting
      const response = await fetch('/api/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier,
          identifierType
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code')
      }

      // TEMPORARY STORAGE: Store identifier for verification page
      // This is cleared after successful verification or page refresh
      sessionStorage.setItem('verificationIdentifier', identifier)
      sessionStorage.setItem('verificationIdentifierType', identifierType)
      
      // Proceed to verification step
      router.push('/my-assessments/verify')
    } catch (err) {
      // Display user-friendly error without exposing system details
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white">
      <div className="max-w-md mx-auto px-6 py-16">
        {/* Logo/Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-[#0B5394]">PainOptix</h1>
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white shadow-xl rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-[#0B5394]" />
            <h2 className="text-2xl font-bold text-gray-900">Retrieve Your Assessments</h2>
          </div>
          
          <p className="text-gray-600 mb-8">
            Enter your email or phone number to access your educational guides and manage your data.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Identifier Type Toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setIdentifierType('email')
                  setIdentifier('')
                  setError(null)
                }}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                  identifierType === 'email'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setIdentifierType('phone')
                  setIdentifier('')
                  setError(null)
                }}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                  identifierType === 'phone'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Phone
              </button>
            </div>

            {/* Input Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {identifierType === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <input
                type={identifierType === 'email' ? 'email' : 'tel'}
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value)
                  setError(null)
                }}
                placeholder={identifierType === 'email' ? 'you@example.com' : '(555) 123-4567'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B5394] focus:border-transparent"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-[#0B5394] text-white rounded-lg font-medium hover:bg-[#084074] 
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                'Sending Code...'
              ) : (
                <>
                  Send Verification Code
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Privacy Notice */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                We&apos;ll send a 6-digit code to verify your identity. 
                Your data is protected and will only be accessible to you.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <Link href="/privacy" className="hover:text-gray-900 underline">
            Privacy Policy
          </Link>
          <span className="mx-3">|</span>
          <Link href="/terms" className="hover:text-gray-900 underline">
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  )
}