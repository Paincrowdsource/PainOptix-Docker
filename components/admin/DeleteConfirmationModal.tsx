'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { X, AlertTriangle } from 'lucide-react'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string, notes?: string) => Promise<void>
  assessment: {
    id: string
    email: string | null
    phone_number: string | null
    guide_type: string
    payment_tier: string
    payment_completed: boolean
    created_at: string
  }
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  assessment
}: DeleteConfirmationModalProps) {
  const [deletionReason, setDeletionReason] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [showOtherField, setShowOtherField] = useState(false)

  if (!isOpen) return null

  const handleReasonChange = (reason: string) => {
    setDeletionReason(reason)
    setShowOtherField(reason === 'other')
    if (reason !== 'other') {
      setAdditionalNotes('')
    }
  }

  const handleConfirm = async () => {
    if (!deletionReason) return
    if (deletionReason === 'other' && !additionalNotes.trim()) return

    setIsDeleting(true)
    try {
      await onConfirm(deletionReason, additionalNotes)
      onClose()
    } catch (error) {
      console.error('Error deleting assessment:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Delete Assessment Record</h2>
              <p className="text-sm text-gray-500 mt-1">This action cannot be undone</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isDeleting}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Assessment Details */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">User:</span> {assessment.email || assessment.phone_number || 'N/A'}</p>
              <p><span className="font-medium">Assessment Date:</span> {format(new Date(assessment.created_at), 'PPP')}</p>
              <p><span className="font-medium">Guide Type:</span> {assessment.guide_type?.replace(/_/g, ' ')}</p>
              <p><span className="font-medium">Payment Status:</span> {assessment.payment_tier} {assessment.payment_completed ? '(Paid)' : '(Free)'}</p>
            </div>
          </div>

          {/* Deletion Reason */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deletion Reason (required)
            </label>
            <select
              value={deletionReason}
              onChange={(e) => handleReasonChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isDeleting}
            >
              <option value="">Select a reason...</option>
              <option value="user_requested_deletion">User requested deletion</option>
              <option value="test_data_cleanup">Test data cleanup</option>
              <option value="duplicate_entry">Duplicate entry</option>
              <option value="data_entry_error">Data entry error</option>
              <option value="privacy_compliance_request">Privacy compliance request</option>
              <option value="other">Other (specify)</option>
            </select>
          </div>

          {/* Additional Notes */}
          {showOtherField && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (required for &quot;Other&quot;)
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Please specify the reason..."
                disabled={isDeleting}
              />
            </div>
          )}

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-2">This will permanently delete:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Assessment responses</li>
                  <li>Generated guide references</li>
                  <li>Email/SMS delivery logs</li>
                  <li>Drop-off tracking data</li>
                  <li>Related analytics data</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!deletionReason || (deletionReason === 'other' && !additionalNotes.trim()) || isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}