'use client'

import { useState, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Search, Download, Eye, Mail, MessageSquare, CheckCircle, XCircle, Trash2, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import DeleteConfirmationModal from '@/components/admin/DeleteConfirmationModal'

interface Assessment {
  id: string
  research_id: string | null
  email: string | null
  phone_number: string | null
  name: string | null
  guide_type: string
  payment_tier: string
  payment_completed: boolean
  delivery_method: string | null
  sms_opt_in: boolean
  created_at: string
  guide_deliveries?: any[]
  responses?: any
  follow_ups?: any[]
}

interface Props {
  assessments: Assessment[]
}

/**
 * Assessments Client Component
 *
 * Renders assessments data provided by the Server Component parent.
 * Handles all interactivity: search, export, modals, etc.
 * No API calls - data comes from props (server-side).
 * Uses router.refresh() to trigger server-side refetch.
 */
export default function AssessmentsClient({ assessments: initialAssessments }: Props) {
  const [assessments, setAssessments] = useState<Assessment[]>(initialAssessments)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; assessment: Assessment | null }>({
    isOpen: false,
    assessment: null
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleRefresh = async () => {
    setRefreshing(true)
    // Trigger server-side data refetch
    router.refresh()
    // Reset refreshing state after a short delay
    setTimeout(() => setRefreshing(false), 1000)
  }

  const filteredAssessments = assessments.filter(assessment => {
    const search = searchTerm.toLowerCase()
    return (
      assessment.research_id?.toLowerCase().includes(search) ||
      assessment.email?.toLowerCase().includes(search) ||
      assessment.phone_number?.includes(search) ||
      assessment.name?.toLowerCase().includes(search) ||
      assessment.guide_type?.toLowerCase().includes(search)
    )
  })

  const exportToCSV = () => {
    const headers = ['Research ID', 'Email', 'Phone', 'Delivery Method', 'Guide Type', 'Payment Tier', 'Created At']
    const rows = filteredAssessments.map(a => [
      a.research_id || '',
      a.email || '',
      a.phone_number || '',
      a.delivery_method || '',
      a.guide_type,
      a.payment_tier,
      new Date(a.created_at).toLocaleString()
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `assessments-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const viewDetails = (assessment: Assessment) => {
    setSelectedAssessment(assessment)
  }

  const handleDeleteClick = (assessment: Assessment) => {
    setDeleteModal({ isOpen: true, assessment })
  }

  const handleDeleteConfirm = async (reason: string, notes?: string) => {
    if (!deleteModal.assessment) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/assessments/${deleteModal.assessment.id}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deletionReason: reason,
          additionalNotes: notes
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete assessment')
      }

      // Remove the deleted assessment from the list
      setAssessments(prev => prev.filter(a => a.id !== deleteModal.assessment!.id))

      // Close the modal
      setDeleteModal({ isOpen: false, assessment: null })
    } catch (error) {
      console.error('Error deleting assessment:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete assessment')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Assessments</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Research ID, email, phone, name, or guide type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {filteredAssessments.length === 0 && searchTerm && (
          <p className="text-sm text-gray-500 mt-2">No results found for &quot;{searchTerm}&quot;</p>
        )}
      </div>

      {/* Assessments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Research ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guide Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAssessments.map((assessment) => {
                const emailDelivery = assessment.guide_deliveries?.find(d => d.delivery_method === 'email')
                const smsDelivery = assessment.guide_deliveries?.find(d => d.delivery_method === 'sms')

                return (
                  <tr key={assessment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-blue-600 font-medium">
                        {assessment.research_id || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        {assessment.email && (
                          <div className="text-sm font-medium text-gray-900">{assessment.email}</div>
                        )}
                        {assessment.phone_number && (
                          <div className="text-sm text-gray-500">{assessment.phone_number}</div>
                        )}
                        {assessment.delivery_method && (
                          <span className={`inline-flex mt-1 text-xs px-1.5 py-0.5 rounded ${
                            assessment.delivery_method === 'sms' ? 'bg-green-100 text-green-700' :
                            assessment.delivery_method === 'email' ? 'bg-blue-100 text-blue-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {assessment.delivery_method.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {assessment.guide_type?.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        assessment.payment_tier === 'comprehensive' ? 'bg-green-100 text-green-800' :
                        assessment.payment_tier === 'enhanced' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {assessment.payment_tier === 'free' ? 'Free' :
                         assessment.payment_tier === 'comprehensive' ? 'Comp' :
                         assessment.payment_tier === 'enhanced' ? 'Paid' :
                         assessment.payment_tier}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {emailDelivery && (
                          <div className="flex items-center">
                            {emailDelivery.delivery_status === 'sent' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <Mail className="h-4 w-4 text-gray-400 ml-1" />
                          </div>
                        )}
                        {smsDelivery && (
                          <div className="flex items-center">
                            {smsDelivery.delivery_status === 'sent' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <MessageSquare className="h-4 w-4 text-gray-400 ml-1" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDistanceToNow(new Date(assessment.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => viewDetails(assessment)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(assessment)}
                          className="text-gray-400 hover:text-red-600 transition-colors duration-200 group relative"
                          disabled={isDeleting}
                          title={
                            new Date(assessment.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
                              ? "Cannot delete assessments less than 24 hours old"
                              : "Delete this assessment and all related data"
                          }
                        >
                          <Trash2 className="h-5 w-5" />
                          {new Date(assessment.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000 && (
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Less than 24 hours old
                            </span>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold">Assessment Details</h2>
                <button
                  onClick={() => setSelectedAssessment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Contact Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p><strong>Research ID:</strong> <span className="font-mono text-blue-600">{selectedAssessment.research_id || 'N/A'}</span></p>
                    <p><strong>Email:</strong> {selectedAssessment.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> {selectedAssessment.phone_number || 'N/A'}</p>
                    <p><strong>Name:</strong> {selectedAssessment.name || 'N/A'}</p>
                    <p><strong>Delivery Method:</strong> {selectedAssessment.delivery_method || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Assessment Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p><strong>Guide Type:</strong> {selectedAssessment.guide_type?.replace(/_/g, ' ')}</p>
                    <p><strong>Payment Tier:</strong> {selectedAssessment.payment_tier}</p>
                    <p><strong>Payment Completed:</strong> {selectedAssessment.payment_completed ? 'Yes' : 'No'}</p>
                    <p><strong>Created:</strong> {new Date(selectedAssessment.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Responses</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">
                      {JSON.stringify(selectedAssessment.responses, null, 2)}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Delivery Status</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {selectedAssessment.guide_deliveries?.map((delivery: any) => (
                      <div key={delivery.id} className="mb-2">
                        <p>
                          <strong>{delivery.delivery_method}:</strong> {delivery.delivery_status}
                          {delivery.error_message && (
                            <span className="text-red-600 ml-2">({delivery.error_message})</span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.assessment && (
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, assessment: null })}
          onConfirm={handleDeleteConfirm}
          assessment={deleteModal.assessment}
        />
      )}
    </div>
  )
}
