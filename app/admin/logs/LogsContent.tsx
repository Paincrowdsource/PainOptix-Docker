'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  Mail, 
  MessageSquare, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  XCircle,
  Search,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Eye,
  MoreVertical,
  Loader2
} from 'lucide-react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

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
  file_size_bytes?: number
  page_count?: number
}

interface PaymentLog {
  id: string
  assessment_id: string
  tier: string
  status: string
  amount_cents: number
  customer_email: string
  created_at: string
  stripe_session_id?: string
}

interface SystemLog {
  id: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  category?: string
  assessment_id?: string
  error_message?: string
  created_at: string
}

export default function LogsContent() {
  const [logs, setLogs] = useState<{
    communications: CommunicationLog[]
    pdfs: PDFLog[]
    payments: PaymentLog[]
    system: SystemLog[]
  }>({
    communications: [],
    pdfs: [],
    payments: [],
    system: []
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'communications' | 'pdfs' | 'payments' | 'system'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 7),
    to: new Date()
  })
  const [refreshing, setRefreshing] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const fetchLogs = async () => {
    try {
      setRefreshing(true)
      const supabase = createClientComponentClient()
      
      // Fetch communication logs
      const { data: commData, error: commError } = await supabase
        .from('communication_logs')
        .select('*')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false })
        .limit(100)

      if (commError && commError.code !== 'PGRST116') {
        console.error('Communication logs error:', commError)
      }
      
      // Fetch PDF logs
      const { data: pdfData, error: pdfError } = await supabase
        .from('pdf_generation_logs')
        .select('*')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false })
        .limit(100)

      if (pdfError && pdfError.code !== 'PGRST116') {
        console.error('PDF logs error:', pdfError)
      }

      // Fetch payment logs
      const { data: payData, error: payError } = await supabase
        .from('payment_logs')
        .select('*')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false })
        .limit(100)

      if (payError && payError.code !== 'PGRST116') {
        console.error('Payment logs error:', payError)
      }

      // Fetch system logs
      const { data: sysData, error: sysError } = await supabase
        .from('system_logs')
        .select('*')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false })
        .limit(100)

      if (sysError && sysError.code !== 'PGRST116') {
        console.error('System logs error:', sysError)
      }

      setLogs({
        communications: commData || [],
        pdfs: pdfData || [],
        payments: payData || [],
        system: sysData || []
      })

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
  }, [dateRange])

  // Calculate stats
  const stats = useMemo(() => {
    const totalComms = logs.communications.length
    const delivered = logs.communications.filter(l => l.status === 'delivered').length
    const failed = logs.communications.filter(l => l.status === 'failed' || l.status === 'bounced').length
    const successRate = totalComms > 0 ? Math.round((delivered / totalComms) * 100) : 0

    const totalPayments = logs.payments.reduce((sum, p) => sum + (p.amount_cents || 0), 0)
    const successfulPayments = logs.payments.filter(p => p.status === 'succeeded').length

    return {
      totalCommunications: totalComms,
      successRate,
      totalPDFs: logs.pdfs.length,
      totalRevenue: totalPayments / 100,
      successfulPayments,
      systemErrors: logs.system.filter(l => l.level === 'error').length
    }
  }, [logs])

  // Filter logs based on search and filters
  const filteredLogs = useMemo(() => {
    let filtered = {
      communications: [...logs.communications],
      pdfs: [...logs.pdfs],
      payments: [...logs.payments],
      system: [...logs.system]
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered.communications = filtered.communications.filter(l => 
        l.recipient?.toLowerCase().includes(search) ||
        l.subject?.toLowerCase().includes(search) ||
        l.message?.toLowerCase().includes(search) ||
        l.assessment_id?.toLowerCase().includes(search)
      )
      filtered.pdfs = filtered.pdfs.filter(l =>
        l.assessment_id?.toLowerCase().includes(search) ||
        l.requested_by?.toLowerCase().includes(search)
      )
      filtered.payments = filtered.payments.filter(l =>
        l.customer_email?.toLowerCase().includes(search) ||
        l.assessment_id?.toLowerCase().includes(search) ||
        l.stripe_session_id?.toLowerCase().includes(search)
      )
      filtered.system = filtered.system.filter(l =>
        l.message?.toLowerCase().includes(search) ||
        l.assessment_id?.toLowerCase().includes(search)
      )
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered.communications = filtered.communications.filter(l => l.status === filterStatus)
      filtered.pdfs = filtered.pdfs.filter(l => l.status === filterStatus)
      filtered.payments = filtered.payments.filter(l => l.status === filterStatus)
    }

    // Apply type filter for communications
    if (filterType !== 'all' && activeTab === 'communications') {
      filtered.communications = filtered.communications.filter(l => l.type === filterType)
    }

    return filtered
  }, [logs, searchTerm, filterStatus, filterType, activeTab])

  // Export to CSV
  const exportToCSV = () => {
    const data = activeTab === 'all' 
      ? [...filteredLogs.communications, ...filteredLogs.pdfs, ...filteredLogs.payments]
      : filteredLogs[activeTab as keyof typeof filteredLogs]

    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${activeTab}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string, text: string, icon: any }> = {
      'delivered': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      'succeeded': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      'success': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      'sent': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      'processing': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      'failed': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      'bounced': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      'error': { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle }
    }

    const style = styles[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle }
    const Icon = style.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    )
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      'email': Mail,
      'sms': MessageSquare,
      'pdf': FileText,
      'payment': DollarSign
    }
    const Icon = icons[type] || AlertCircle
    return <Icon className="w-4 h-4" />
  }

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading logs...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <p className="text-red-800">Error loading logs: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">System Logs & Monitoring</h1>
          <p className="text-gray-600 mt-1">Real-time monitoring of all system activities</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Communications</p>
              <p className="text-2xl font-bold mt-1">{stats.totalCommunications}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.successRate}% success rate
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">PDFs Generated</p>
              <p className="text-2xl font-bold mt-1">{stats.totalPDFs}</p>
              <p className="text-xs text-gray-500 mt-1">Documents created</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold mt-1">${stats.totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.successfulPayments} successful
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <p className="text-2xl font-bold mt-1">
                {stats.systemErrors === 0 ? 'Healthy' : `${stats.systemErrors} Errors`}
              </p>
              <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
            </div>
            <div className={`p-3 rounded-lg ${stats.systemErrors === 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <Activity className={`h-6 w-6 ${stats.systemErrors === 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="succeeded">Succeeded</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="pdf">PDF</option>
          </select>

          <button className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
            </span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['all', 'communications', 'pdfs', 'payments', 'system'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab !== 'all' && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                    {filteredLogs[tab as keyof typeof filteredLogs].length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Communications Tab */}
          {(activeTab === 'all' || activeTab === 'communications') && filteredLogs.communications.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-3">Communication Logs</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject/Message</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLogs.communications.slice(0, activeTab === 'all' ? 5 : undefined).map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {format(new Date(log.created_at), 'MMM d, h:mm a')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(log.type)}
                            <span className="text-sm text-gray-900">{log.type}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{log.recipient}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                          {log.subject || log.message || '-'}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(log.status)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleRowExpansion(log.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {expandedRows.has(log.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PDFs Tab */}
          {(activeTab === 'all' || activeTab === 'pdfs') && filteredLogs.pdfs.length > 0 && (
            <div className="space-y-4 mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">PDF Generation Logs</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested By</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLogs.pdfs.slice(0, activeTab === 'all' ? 5 : undefined).map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {format(new Date(log.created_at), 'MMM d, h:mm a')}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                            {log.tier}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{log.requested_by || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {log.file_size_bytes ? `${(log.file_size_bytes / 1024).toFixed(1)} KB` : '-'}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(log.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {(activeTab === 'all' || activeTab === 'payments') && filteredLogs.payments.length > 0 && (
            <div className="space-y-4 mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Payment Logs</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLogs.payments.slice(0, activeTab === 'all' ? 5 : undefined).map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {format(new Date(log.created_at), 'MMM d, h:mm a')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{log.customer_email}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
                            {log.tier}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          ${(log.amount_cents / 100).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(log.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* System Tab */}
          {(activeTab === 'all' || activeTab === 'system') && filteredLogs.system.length > 0 && (
            <div className="space-y-4 mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">System Logs</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLogs.system.slice(0, activeTab === 'all' ? 5 : undefined).map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {format(new Date(log.created_at), 'MMM d, h:mm a')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            log.level === 'error' ? 'bg-red-100 text-red-800' :
                            log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                            log.level === 'info' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {log.level.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{log.category || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-md truncate">{log.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {activeTab !== 'all' && filteredLogs[activeTab as keyof typeof filteredLogs].length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No logs found for the selected filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}