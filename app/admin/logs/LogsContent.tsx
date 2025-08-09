'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Activity, AlertCircle, CheckCircle, XCircle, Clock, RefreshCw, Search, Filter, FileText, DollarSign, Mail, MessageSquare } from 'lucide-react'

interface CommunicationLog {
  id: string
  assessment_id: string
  type: 'email' | 'sms' | 'pdf' | 'notification'
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced'
  recipient: string
  subject?: string
  message?: string
  error_message?: string
  created_at: string
  metadata?: any
}

interface PDFLog {
  id: string
  assessment_id: string
  tier: string
  status: string
  error_message?: string
  created_at: string
  requested_by?: string
}

interface PaymentLog {
  id: string
  assessment_id: string
  tier: string
  status: string
  amount_cents: number
  customer_email: string
  created_at: string
}

export default function LogsContent() {
  const [logs, setLogs] = useState<CommunicationLog[]>([])
  const [pdfLogs, setPdfLogs] = useState<PDFLog[]>([])
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'communications' | 'pdfs' | 'payments'>('all')
  const [filterType, setFilterType] = useState<'all' | 'email' | 'sms'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchLogs = async () => {
    try {
      setRefreshing(true)
      const supabase = createClientComponentClient()
      
      // Fetch communication logs
      let commQuery = supabase
        .from('communication_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (filterType !== 'all') {
        commQuery = commQuery.eq('type', filterType)
      }
      
      if (filterStatus !== 'all') {
        commQuery = commQuery.eq('status', filterStatus)
      }

      if (searchTerm) {
        commQuery = commQuery.or(`recipient.ilike.%${searchTerm}%,assessment_id.ilike.%${searchTerm}%`)
      }

      const { data: commData, error: commError } = await commQuery

      if (commError && commError.code !== 'PGRST116') {
        throw commError
      }
      setLogs(commData || [])

      // Fetch PDF logs
      const { data: pdfData, error: pdfError } = await supabase
        .from('pdf_generation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (pdfError && pdfError.code !== 'PGRST116') {
        console.error('PDF logs error:', pdfError)
      } else if (pdfData) {
        setPdfLogs(pdfData)
      }

      // Fetch payment logs
      const { data: payData, error: payError } = await supabase
        .from('payment_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (payError && payError.code !== 'PGRST116') {
        console.error('Payment logs error:', payError)
      } else if (payData) {
        setPaymentLogs(payData)
      }

    } catch (err: any) {
      console.error('Error fetching logs:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [filterType, filterStatus, searchTerm])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'sent':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'failed':
      case 'bounced':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
      case 'bounced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeBadgeClass = (type: string) => {
    switch(type) {
      case 'email': return 'bg-purple-100 text-purple-800'
      case 'sms': return 'bg-indigo-100 text-indigo-800'
      case 'pdf': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <MessageSquare className="h-4 w-4" />
      case 'pdf': return <FileText className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading communication logs...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <p className="text-red-800">Error loading logs: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Communication Logs</h1>
        <button
          onClick={fetchLogs}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Search className="inline h-4 w-4 mr-1" />
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by recipient or ID..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="inline h-4 w-4 mr-1" />
              Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="inline h-4 w-4 mr-1" />
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
              <option value="bounced">Bounced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject/Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assessment ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeClass(log.type)}`}>
                        {log.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(log.status)}`}>
                        {getStatusIcon(log.status)}
                        <span className="ml-1">{log.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.recipient}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">
                        {log.subject || log.message || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {log.assessment_id?.slice(0, 8)}...
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600">
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

      {/* Tabs for different log types */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setActiveTab('communications')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'communications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Communications ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('pdfs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pdfs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            PDF Generation ({pdfLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Payments ({paymentLogs.length})
          </button>
        </nav>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Communications</p>
              <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
            </div>
            <Activity className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">PDFs Generated</p>
              <p className="text-2xl font-bold text-orange-600">{pdfLogs.length}</p>
            </div>
            <FileText className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Payments</p>
              <p className="text-2xl font-bold text-green-600">{paymentLogs.length}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {logs.length > 0 
                  ? Math.round((logs.filter(l => l.status === 'delivered' || l.status === 'sent').length / logs.length) * 100)
                  : 0}%
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>
    </div>
  )
}