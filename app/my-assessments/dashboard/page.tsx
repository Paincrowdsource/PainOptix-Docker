'use client'

/**
 * User Assessments Dashboard
 * 
 * PURPOSE:
 * - Authenticated dashboard for users to view and manage their assessments
 * - Provides access to educational guides and PDF downloads
 * - Implements GDPR "Right to Erasure" through deletion functionality
 * 
 * SECURITY CONSIDERATIONS:
 * - Session token validation on every page load
 * - Automatic redirect to login if session expired
 * - Server-side authorization for all data access
 * - Secure deletion with user confirmation
 * - Client-side token stored in sessionStorage (cleared on logout)
 * 
 * GDPR COMPLIANCE:
 * - Implements Article 15 "Right of Access" - users can view their data
 * - Implements Article 17 "Right to Erasure" - users can delete their data
 * - Clear privacy notice about data retention policies
 * - Transparent information about what data is collected and how it's used
 * 
 * SAMD COMPLIANCE:
 * - Maintains access to educational guides as required for medical device
 * - Preserves payment records for accounting (disclosed to user)
 * - Tracks user access for audit purposes
 * 
 * USER EXPERIENCE:
 * - Clean, organized display of assessment history
 * - One-click access to guides and downloads
 * - Visual indicators for delivery status
 * - Responsive design for mobile accessibility
 * - Confirmation modal for destructive actions
 * 
 * DATA FLOW:
 * 1. Validate session token on page load
 * 2. Fetch user's assessments with delivery status
 * 3. Display formatted assessment list with actions
 * 4. Handle guide viewing, PDF downloads, and deletions
 * 5. Maintain session state and handle logout
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { FileText, Download, Trash2, ChevronLeft, Shield, Calendar, DollarSign, CheckCircle } from 'lucide-react'
import UserDeleteModal from '@/components/UserDeleteModal'

interface Assessment {
  id: string
  date: string
  condition: string
  tier: string
  isPaid: boolean
  deliveryStatus: string
  canDownload: boolean
}

export default function UserAssessmentsDashboard() {
  const router = useRouter()
  
  // Component state management
  const [assessments, setAssessments] = useState<Assessment[]>([]) // User's assessment history
  const [loading, setLoading] = useState(true) // Loading state for initial data fetch
  const [error, setError] = useState<string | null>(null) // Error display for failed operations
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; assessmentId: string | null }>({
    isOpen: false,
    assessmentId: null
  }) // Modal state for deletion confirmation
  const [userIdentifier, setUserIdentifier] = useState<string | null>(null) // Email/phone for display

  /**
   * Component initialization and session validation
   * 
   * SECURITY FLOW:
   * 1. Check for valid session token
   * 2. Redirect to login if no token exists
   * 3. Decode token to extract user identifier (for display)
   * 4. Load user's assessments with authorization
   */
  useEffect(() => {
    // SECURITY: Validate session token exists
    const token = sessionStorage.getItem('userSessionToken')
    if (!token) {
      // Redirect to login if not authenticated
      router.push('/my-assessments')
      return
    }

    // Decode token to extract user identifier for display purposes
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
      setUserIdentifier(decoded.identifier)
    } catch (err) {
      console.error('Error decoding token:', err)
      // Continue even if decode fails - identifier is only for display
    }

    // Load user's assessment data with authentication
    loadAssessments(token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  /**
   * Loads user's assessments with server-side authorization
   * 
   * SECURITY FEATURES:
   * - Bearer token authentication
   * - Automatic session cleanup on expiration
   * - Server-side validation of data access rights
   */
  const loadAssessments = async (token: string) => {
    try {
      // Fetch assessments with authorization header
      const response = await fetch('/api/user-assessments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          // SECURITY: Session expired - clean up and redirect
          sessionStorage.removeItem('userSessionToken')
          router.push('/my-assessments')
          return
        }
        throw new Error(data.error || 'Failed to load assessments')
      }

      setAssessments(data.assessments)
    } catch (err) {
      // Display user-friendly error without exposing system details
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handles PDF download requests
   * Maps display tier names to API parameters for guide generation
   */
  const handleDownload = (assessmentId: string, tier: string) => {
    // Map user-friendly tier names to API parameters
    const tierParam = tier.includes('$20') ? 'monograph' : 
                     tier.includes('$5') ? 'enhanced' : 
                     'free'
    
    // Direct download via API endpoint (includes authorization check)
    window.location.href = `/api/download-guide?id=${assessmentId}&tier=${tierParam}`
  }

  /**
   * Handles assessment deletion with GDPR compliance
   * 
   * GDPR COMPLIANCE:
   * - Implements "Right to Erasure" (Article 17)
   * - Immediate removal from user's view
   * - Server-side permanent deletion with audit trail
   * 
   * SECURITY:
   * - Server validates deletion request
   * - Audit trail maintained for compliance
   * - User feedback without exposing system details
   */
  const handleDelete = async () => {
    if (!deleteModal.assessmentId) return

    try {
      // Send deletion request to server
      const response = await fetch(`/api/user-delete-data`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId: deleteModal.assessmentId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete data')
      }

      // Immediately remove from user's view (optimistic update)
      setAssessments(prev => prev.filter(a => a.id !== deleteModal.assessmentId))
      setDeleteModal({ isOpen: false, assessmentId: null })
      
      // Provide user confirmation
      alert('Your assessment data has been deleted successfully')
    } catch (error) {
      console.error('Error deleting data:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete data')
    }
  }

  /**
   * Handles user logout with session cleanup
   * Removes authentication token and redirects to login
   */
  const handleLogout = () => {
    // Clean up authentication session
    sessionStorage.removeItem('userSessionToken')
    router.push('/my-assessments')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading your assessments...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/" className="inline-block mb-4">
              <h1 className="text-3xl font-bold text-[#0B5394]">PainOptix</h1>
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">Your Assessments</h2>
            {userIdentifier && (
              <p className="text-gray-600 mt-1">Logged in as: {userIdentifier}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            Log out
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Assessments List */}
        {assessments.length === 0 ? (
          <div className="bg-white shadow-xl rounded-2xl p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No assessments found</h3>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t find any assessments associated with this contact information.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0B5394] text-white rounded-lg hover:bg-[#084074] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Take an Assessment
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {assessments.map((assessment) => (
              <div key={assessment.id} className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {assessment.condition}
                      </h3>
                      {assessment.deliveryStatus === 'sent' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(assessment.date), 'MMMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {assessment.tier}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => router.push(`/guide/${assessment.id}`)}
                      className="px-4 py-2 text-[#0B5394] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                    >
                      View Guide
                    </button>
                    <button
                      onClick={() => handleDownload(assessment.id, assessment.tier)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, assessmentId: assessment.id })}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete assessment"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Privacy Notice */}
        <div className="mt-12 p-6 bg-gray-50 rounded-xl">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Your Privacy Matters</p>
              <p>
                You can delete any assessment at any time. Deletion removes all personal data 
                and assessment responses. Payment records are retained for accounting purposes only.
              </p>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteModal.assessmentId && (
          <UserDeleteModal
            isOpen={deleteModal.isOpen}
            onClose={() => setDeleteModal({ isOpen: false, assessmentId: null })}
            onConfirm={handleDelete}
            assessmentId={deleteModal.assessmentId}
            userEmail={userIdentifier?.includes('@') ? userIdentifier : null}
            userPhone={!userIdentifier?.includes('@') ? userIdentifier : null}
          />
        )}
      </div>
    </div>
  )
}