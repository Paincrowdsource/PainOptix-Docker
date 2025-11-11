'use client'

import { useState, useEffect, useMemo } from 'react'
import { getBrowserSupabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { Mail, MessageSquare, CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react'

interface DeliveryLog {
  id: string
  assessment_id: string
  delivery_method: string
  delivery_status: string
  delivered_at: string | null
  error_message: string | null
  assessment: {
    email: string | null
    phone_number: string | null
    guide_type: string
  }
}

interface OptOut {
  id: string
  phone_number: string
  opted_out_at: string
  opt_out_source: string
}

export default function CommunicationsPage() {
  const supabase = useMemo(() => getBrowserSupabase(), [])
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([])
  const [optOuts, setOptOuts] = useState<OptOut[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'failed' | 'optouts'>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setError(null) // Clear previous errors
      // Use API endpoint to fetch data with service role permissions
      const response = await fetch(`/api/admin/communications?ts=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          // Add admin password as fallback auth
          'x-admin-password': 'PainOptix2025Admin!'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        const errorMessage = response.status === 401
          ? 'Admin session invalid - please contact support or check your credentials'
          : errorData.error || 'Failed to fetch communications data';
        throw new Error(errorMessage)
      }

      const data = await response.json()

      setDeliveryLogs(data.deliveryLogs || [])
      setOptOuts(data.optOuts || [])
      setError(null) // Clear error on success

      // Log communication logs for debugging
      if (data.communicationLogs && data.communicationLogs.length > 0) {
        console.log(`Found ${data.communicationLogs.length} communication logs (SendGrid/Twilio)`)
      }
    } catch (err) {
      console.error('Error loading communications data:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load communications data';
      setError(errorMessage);
    } finally {
      setLoading(false)
    }
  }

  const handleRetryFailed = async () => {
    setRetrying(true)
    try {
      // Get failed deliveries
      const { data: failedDeliveries } = await supabase
        .from('guide_deliveries')
        .select('*, assessment:assessments(*)')
        .in('delivery_status', ['failed', 'pending'])
        .eq('delivery_method', 'email')

      let successCount = 0
      let failureCount = 0

      // Retry each failed delivery
      for (const delivery of failedDeliveries || []) {
        try {
          // Call the send-guide API to retry
          const response = await fetch('/api/send-guide', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assessmentId: delivery.assessment_id })
          })

          if (response.ok) {
            successCount++
          } else {
            failureCount++
          }
        } catch (error) {
          failureCount++
        }
      }

      alert(`Retry complete: ${successCount} succeeded, ${failureCount} failed`)
      await loadData() // Reload data
    } catch (err) {
      console.error('Error retrying failed emails:', err)
      alert('Failed to retry emails')
    } finally {
      setRetrying(false)
    }
  }

  const filteredLogs = deliveryLogs.filter(log => {
    if (activeTab === 'failed') {
      return log.delivery_status === 'failed' || log.delivery_status === 'pending'
    }
    return true
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading communications data...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Communications</h1>
        {activeTab === 'failed' && (
          <button
            onClick={handleRetryFailed}
            disabled={retrying}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Retrying...' : 'Retry Failed Emails'}
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <XCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error Loading Communications</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={loadData}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 ml-3"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Deliveries
        </button>
        <button
          onClick={() => setActiveTab('failed')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'failed'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Failed Deliveries
        </button>
        <button
          onClick={() => setActiveTab('optouts')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'optouts'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          SMS Opt-outs
        </button>
      </div>

      {/* Content */}
      {activeTab !== 'optouts' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guide Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {log.delivery_method === 'email' ? (
                          <Mail className="h-4 w-4 text-gray-400" />
                        ) : (
                          <MessageSquare className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="ml-2 text-sm text-gray-900">{log.delivery_method}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {log.delivery_method === 'email' 
                          ? log.assessment.email 
                          : log.assessment.phone_number}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {log.assessment.guide_type?.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {log.delivery_status === 'sent' ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="ml-2 text-sm text-green-800">Sent</span>
                          </>
                        ) : log.delivery_status === 'failed' ? (
                          <>
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="ml-2 text-sm text-red-800">Failed</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                            <span className="ml-2 text-sm text-yellow-800">Pending</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.delivered_at 
                        ? formatDistanceToNow(new Date(log.delivered_at), { addSuffix: true })
                        : 'Not sent'}
                    </td>
                    <td className="px-4 py-4">
                      {log.error_message && (
                        <div className="text-sm text-red-600 max-w-xs truncate" title={log.error_message}>
                          {log.error_message}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // SMS Opt-outs tab
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opted Out
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {optOuts.map((optOut) => (
                  <tr key={optOut.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{optOut.phone_number}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDistanceToNow(new Date(optOut.opted_out_at), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        {optOut.opt_out_source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Deliveries</p>
              <p className="text-2xl font-bold">{deliveryLogs.length}</p>
            </div>
            <Mail className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Failed Deliveries</p>
              <p className="text-2xl font-bold text-red-600">
                {deliveryLogs.filter(l => l.delivery_status === 'failed').length}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">SMS Opt-outs</p>
              <p className="text-2xl font-bold">{optOuts.length}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  )
}
