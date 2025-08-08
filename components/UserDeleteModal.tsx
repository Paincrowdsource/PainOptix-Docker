'use client'

/**
 * UserDeleteModal Component
 * 
 * PURPOSE:
 * - Provides a secure, user-friendly modal for permanent deletion of assessment data
 * - Ensures user consent through explicit confirmation (typing "DELETE")
 * - Displays clear information about what will and won't be deleted
 * 
 * GDPR COMPLIANCE:
 * - Implements "Right to Erasure" (Article 17) by allowing users to delete personal data
 * - Provides clear information about data retention policies (payment records)
 * - Requires explicit user confirmation to prevent accidental deletions
 * - Shows transparent information about what data will be removed
 * 
 * SECURITY CONSIDERATIONS:
 * - Requires explicit text confirmation ("DELETE") to prevent accidental deletion
 * - Disables all interactions during deletion process to prevent race conditions
 * - Validates confirmation text before proceeding
 * - Provides clear error messaging without exposing system internals
 * 
 * SAMD COMPLIANCE:
 * - Maintains audit trail through parent component's deletion process
 * - Preserves payment records as required for medical device accounting
 * - Clearly communicates data retention requirements to users
 */

import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'

interface UserDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  assessmentId: string
  userEmail?: string | null
  userPhone?: string | null
}

export default function UserDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  assessmentId,
  userEmail,
  userPhone
}: UserDeleteModalProps) {
  // State management for deletion confirmation process
  const [confirmText, setConfirmText] = useState('') // User's typed confirmation
  const [isDeleting, setIsDeleting] = useState(false) // Prevents multiple deletion attempts
  const [error, setError] = useState<string | null>(null) // User-friendly error messages

  if (!isOpen) return null

  /**
   * Handles the deletion confirmation process
   * 
   * SECURITY FLOW:
   * 1. Validates user typed "DELETE" exactly (case-insensitive)
   * 2. Sets deletion state to prevent UI manipulation during process
   * 3. Calls parent's deletion handler which performs server-side validation
   * 4. Handles errors gracefully without exposing system details
   */
  const handleConfirm = async () => {
    // Require exact confirmation text to prevent accidental deletions
    if (confirmText.toUpperCase() !== 'DELETE') {
      setError('Please type DELETE to confirm')
      return
    }

    setIsDeleting(true)
    setError(null)
    
    try {
      // Delegate to parent component which handles API call and validation
      await onConfirm()
    } catch (err) {
      // Show user-friendly error without exposing system details
      setError('Failed to delete data. Please try again.')
      setIsDeleting(false)
    }
  }

  /**
   * Handles modal closure with state cleanup
   * Prevents closure during active deletion to avoid data corruption
   */
  const handleClose = () => {
    if (!isDeleting) {
      // Clean up form state when closing
      setConfirmText('')
      setError(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold text-gray-900">Delete Your Assessment Data</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isDeleting}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                {/* Clear disclosure of what data will be deleted - GDPR transparency requirement */}
                <p className="font-semibold mb-2">This will permanently delete:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Your assessment responses</li>
                  <li>Personal information ({userEmail ? 'email' : userPhone ? 'phone' : 'contact info'})</li>
                  <li>Guide access</li>
                </ul>
                {/* SAMD compliance: Payment records must be retained for medical device accounting */}
                <p className="mt-3 font-semibold">This will NOT delete:</p>
                <ul className="list-disc list-inside">
                  <li>Payment records (required for accounting)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To confirm, type DELETE below:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value)
                setError(null)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Type DELETE to confirm"
              disabled={isDeleting}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirmText.toUpperCase() !== 'DELETE' || isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete My Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}