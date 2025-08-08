'use client'

/**
 * Verification Code Input Page
 * 
 * PURPOSE:
 * - Secure verification of user identity before granting data access
 * - Implements 6-digit code verification with enhanced UX
 * - Bridges the gap between access request and authenticated session
 * 
 * SECURITY CONSIDERATIONS:
 * - Auto-focus and tab progression for better UX without compromising security
 * - Rate limiting: Maximum 5 attempts per code before regeneration required
 * - Time-limited codes: 15-minute expiration window
 * - Automatic code clearing on failed attempts prevents shoulder surfing
 * - Session storage used temporarily and cleared after successful verification
 * 
 * GDPR COMPLIANCE:
 * - Provides secure access to user's data as required by Article 15
 * - Temporary storage of verification data with immediate cleanup
 * - Clear indication of security measures to build user trust
 * 
 * USER EXPERIENCE:
 * - 6-digit code input with automatic advancement
 * - Paste support for codes from email/SMS
 * - Visual feedback for code entry and validation
 * - Masked identifier display for privacy
 * - One-click resend functionality with rate limiting
 * 
 * VERIFICATION FLOW:
 * 1. Retrieve identifier from session storage (from previous page)
 * 2. Display masked identifier for user confirmation
 * 3. Accept 6-digit code with real-time validation
 * 4. Verify code against server with attempt tracking
 * 5. Create authenticated session on success
 * 6. Clean up temporary data and redirect to dashboard
 */

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, ChevronLeft } from 'lucide-react'

export default function VerifyPage() {
  const router = useRouter()
  
  // Code input state - array of 6 digits for individual input fields
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false) // Prevents multiple verification attempts
  const [isResending, setIsResending] = useState(false) // Prevents multiple resend requests
  const [error, setError] = useState<string | null>(null) // User-friendly error messages
  const [identifier, setIdentifier] = useState<string | null>(null) // Email or phone from previous step
  const [identifierType, setIdentifierType] = useState<string | null>(null) // 'email' or 'phone'
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]) // References for auto-focus management

  /**
   * Initialize component with verification data from previous step
   * Redirects back if no verification context exists (security measure)
   */
  useEffect(() => {
    // Retrieve identifier from temporary session storage
    const storedIdentifier = sessionStorage.getItem('verificationIdentifier')
    const storedType = sessionStorage.getItem('verificationIdentifierType')
    
    if (!storedIdentifier || !storedType) {
      // Security: Prevent direct access without proper verification flow
      router.push('/my-assessments')
      return
    }

    setIdentifier(storedIdentifier)
    setIdentifierType(storedType)
  }, [router])

  /**
   * Handles individual digit input with UX enhancements
   * 
   * SECURITY FEATURES:
   * - Only accepts numeric digits
   * - Automatically advances to next field
   * - Auto-submits when complete code is entered
   * - Clears error state on new input
   */
  const handleCodeChange = (index: number, value: string) => {
    // Security: Only allow single digits (prevents injection)
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    setError(null) // Clear previous errors

    // UX: Auto-advance to next input field
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // UX: Auto-submit when all 6 digits are entered
    if (value && index === 5 && newCode.every(digit => digit)) {
      handleVerify(newCode.join(''))
    }
  }

  /**
   * Handles keyboard navigation for better UX
   * Backspace moves to previous field when current field is empty
   */
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // UX: Backspace navigation
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  /**
   * Handles paste events for codes from email/SMS
   * 
   * SECURITY FEATURES:
   * - Strips non-digits to prevent injection
   * - Only processes exact 6-digit codes
   * - Auto-verifies complete pasted codes
   */
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    // Security: Strip non-digits and limit to 6 characters
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split('')
      setCode([...newCode])
      inputRefs.current[5]?.focus() // Focus last field
      handleVerify(pastedData) // Auto-verify pasted code
    }
  }

  /**
   * Verifies the entered code with the server
   * 
   * SECURITY FLOW:
   * 1. Validate complete 6-digit code
   * 2. Send to server with identifier for verification
   * 3. Server checks code, attempts, and expiration
   * 4. On success: create session token and cleanup temp data
   * 5. On failure: clear code and show error (prevent shoulder surfing)
   * 
   * RATE LIMITING:
   * - Server enforces maximum 5 attempts per code
   * - Code expires after 15 minutes
   * - Failed attempts are tracked and limited
   */
  const handleVerify = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code.join('')
    
    // Validate complete code entry
    if (codeToVerify.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      // Send verification request to server
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier,
          code: codeToVerify
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code')
      }

      // SECURITY: Store authenticated session token
      sessionStorage.setItem('userSessionToken', data.sessionToken)
      
      // CLEANUP: Remove temporary verification data
      sessionStorage.removeItem('verificationIdentifier')
      sessionStorage.removeItem('verificationIdentifierType')
      
      // Proceed to authenticated dashboard
      router.push('/my-assessments/dashboard')
    } catch (err) {
      // Security: Clear code on failure to prevent shoulder surfing
      setError(err instanceof Error ? err.message : 'Verification failed')
      setCode(['', '', '', '', '', '']) // Clear all digits
      inputRefs.current[0]?.focus() // Reset focus to first field
    } finally {
      setIsVerifying(false)
    }
  }

  /**
   * Handles resending verification code
   * 
   * RATE LIMITING:
   * - Server enforces 3 attempts per hour per contact/IP
   * - Previous code is invalidated when new one is sent
   * - User feedback provided for both success and failure
   */
  const handleResend = async () => {
    setIsResending(true)
    setError(null)

    try {
      // Request new verification code (invalidates previous code)
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
        throw new Error(data.error || 'Failed to resend code')
      }

      // Reset form state for new code entry
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
      
      // Show success feedback
      setError('New code sent successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code')
    } finally {
      setIsResending(false)
    }
  }

  /**
   * PRIVACY: Mask identifier for display while maintaining user recognition
   * - Email: shows first 2 chars + domain (ab***@example.com)
   * - Phone: shows first 3 + last 4 digits (123***5678)
   */
  const maskedIdentifier = identifier ? 
    identifierType === 'email' ?
      identifier.replace(/^(.{2})(.*)(@.*)$/, '$1***$3') :
      identifier.replace(/^(.{3})(.*)(.{4})$/, '$1***$3')
    : ''

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
          {/* Back Button */}
          <button
            onClick={() => router.push('/my-assessments')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Verification Code</h2>
            <p className="text-gray-600">
              We sent a 6-digit code to {maskedIdentifier}
            </p>
          </div>

          {/* Code Input */}
          <div className="flex justify-center gap-2 mb-8">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={el => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-[#0B5394] focus:border-transparent"
                maxLength={1}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && (
            <div className={`p-3 mb-6 rounded-lg ${
              error.includes('successfully') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm ${
                error.includes('successfully') ? 'text-green-600' : 'text-red-600'
              }`}>{error}</p>
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={() => handleVerify()}
            disabled={isVerifying || code.join('').length !== 6}
            className="w-full px-6 py-3 bg-[#0B5394] text-white rounded-lg font-medium hover:bg-[#084074] 
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {isVerifying ? 'Verifying...' : 'Verify Code'}
          </button>

          {/* Resend Code */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Didn&apos;t receive it?</p>
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-[#0B5394] hover:text-[#084074] font-medium text-sm"
            >
              {isResending ? 'Resending...' : 'Resend Code'}
            </button>
          </div>

          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                This code expires in 15 minutes. Maximum 5 attempts allowed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}