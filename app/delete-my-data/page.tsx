'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function DeleteMyDataPage() {
  const [identifier, setIdentifier] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [step, setStep] = useState<'request' | 'verify' | 'complete'>('request')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRequestDeletion = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/delete-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      })

      const data = await response.json()
      
      if (data.success) {
        setStep('verify')
      } else {
        setError(data.error || 'Failed to send verification code')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAndDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/delete-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, verificationCode })
      })

      const data = await response.json()
      
      if (data.success) {
        setStep('complete')
      } else {
        setError(data.error || 'Invalid verification code')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Delete My Data</h1>

      {step === 'request' && (
        <form onSubmit={handleRequestDeletion} className="space-y-4">
          <p className="text-gray-600">
            Enter the email or phone number you used for your assessment. 
            We&apos;ll send you a verification code to confirm the deletion.
          </p>
          
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Email or phone number"
            className="w-full p-3 border rounded-lg"
            required
          />
          
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
          
          <p className="text-sm text-gray-500">
            This will permanently delete all your assessment data, including any purchased guides.
          </p>
        </form>
      )}

      {step === 'verify' && (
        <form onSubmit={handleVerifyAndDelete} className="space-y-4">
          <p className="text-gray-600">
            We&apos;ve sent a verification code to {identifier}. 
            Enter it below to confirm deletion.
          </p>
          
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Verification code"
            className="w-full p-3 border rounded-lg"
            required
          />
          
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete All My Data'}
          </button>
          
          <button
            type="button"
            onClick={() => setStep('request')}
            className="w-full text-gray-600 hover:text-gray-800"
          >
            Back
          </button>
        </form>
      )}

      {step === 'complete' && (
        <div className="text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h2 className="text-xl font-semibold">Data Deleted Successfully</h2>
          <p className="text-gray-600">
            All your assessment data has been permanently deleted from our systems.
          </p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to Home
          </Link>
        </div>
      )}
    </div>
  )
}