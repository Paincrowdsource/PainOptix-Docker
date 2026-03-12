'use client'

import { useState, useMemo } from 'react'
import { getBrowserSupabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { Mail, MessageSquare, CheckCircle, XCircle, RefreshCw, AlertCircle, Activity } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

interface CommunicationLog {
  id: string
  assessment_id: string
  channel: 'email' | 'sms'
  status: 'sent' | 'delivered' | 'failed' | 'bounced' | 'pending'
  recipient: string
  subject?: string
  message?: string
  error_message?: string
  created_at: string
}

interface Props {
  deliveryLogs: DeliveryLog[]
  optOuts: OptOut[]
  communicationLogs?: CommunicationLog[]
}

/**
 * Communications Client Component
 *
 * Renders communications data provided by the Server Component parent.
 * Handles interactivity: tabs, retry failed emails, etc.
 * Uses router.refresh() to trigger server-side refetch.
 */
export default function CommunicationsClient({
  deliveryLogs: initialDeliveryLogs,
  optOuts,
  communicationLogs = []
}: Props) {
  const [retrying, setRetrying] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'failed' | 'optouts' | 'sendlogs'>('all')
  const router = useRouter()
  const supabase = useMemo(() => getBrowserSupabase(), [])

  const handleRefresh = async () => {
    setRefreshing(true)
    router.refresh()
    setTimeout(() => setRefreshing(false), 1000)
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
      // Trigger server-side refetch
      router.refresh()
    } catch (err) {
      console.error('Error retrying failed emails:', err)
      alert('Failed to retry emails')
    } finally {
      setRetrying(false)
    }
  }

  const filteredLogs = initialDeliveryLogs.filter(log => {
    if (activeTab === 'failed') {
      return log.delivery_status === 'failed' || log.delivery_status === 'pending'
    }
    return true
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="h-3 w-3" /> Delivered</span>
      case 'sent':
        return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800"><Activity className="h-3 w-3" /> Sent</span>
      case 'failed':
      case 'bounced':
        return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800"><XCircle className="h-3 w-3" /> {status}</span>
      default:
        return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800"><AlertCircle className="h-3 w-3" /> {status}</span>
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Communications</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
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
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b">
        {(['all', 'failed', 'optouts', 'sendlogs'] as const).map((tab) => {
          const labels = {
            all: 'All Deliveries',
            failed: 'Failed Deliveries',
            optouts: 'SMS Opt-outs',
            sendlogs: `Send Logs (${communicationLogs.length})`
          }
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {labels[tab]}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {activeTab === 'sendlogs' ? (
        // Send Logs tab — actual SendGrid/Twilio communication records
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject/Message</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {communicationLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                      No send logs found
                    </td>
                  </tr>
                ) : (
                  communicationLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          log.channel === 'email' ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {log.channel === 'email' ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                          {log.channel?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.recipient}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">{log.subject || log.message || '-'}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <code className="rounded bg-gray-100 px-2 py-1 text-xs">
                          {log.assessment_id?.slice(0, 8)}
                        </code>
                      </td>
                      <td className="px-4 py-4 text-sm text-red-600">
                        {log.error_message ? (
                          <div className="max-w-xs truncate" title={log.error_message}>
                            {log.error_message}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'optouts' ? (
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
      ) : (
        // All Deliveries / Failed Deliveries tabs
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
                          ? log.assessment?.email
                          : log.assessment?.phone_number}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {log.assessment?.guide_type?.replace(/_/g, ' ')}
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
      )}

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Deliveries</p>
              <p className="text-2xl font-bold">{initialDeliveryLogs.length}</p>
            </div>
            <Mail className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Failed Deliveries</p>
              <p className="text-2xl font-bold text-red-600">
                {initialDeliveryLogs.filter(l => l.delivery_status === 'failed').length}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Send Logs</p>
              <p className="text-2xl font-bold">{communicationLogs.length}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-400" />
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
