'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Activity, AlertCircle, CheckCircle, XCircle, Clock, RefreshCw, Search, Filter } from 'lucide-react'

interface CommunicationLog {
  id: string
  assessment_id: string
  type: 'email' | 'sms'
  status: 'sent' | 'delivered' | 'failed' | 'bounced'
  recipient: string
  subject?: string
  message?: string
  error_message?: string
  created_at: string
  metadata?: unknown
}

export default function LogsContent() {
  const supabase = useMemo(() => createClientComponentClient(), [])
  const [logs, setLogs] = useState<CommunicationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'email' | 'sms'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'sent' | 'delivered' | 'failed' | 'bounced'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchLogs = useCallback(async () => {
    try {
      setRefreshing(true)

      let query = supabase
        .from('communication_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (filterType !== 'all') {
        query = query.eq('type', filterType)
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      if (searchTerm) {
        query = query.or(`recipient.ilike.%${searchTerm}%,assessment_id.ilike.%${searchTerm}%`)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      setLogs(data || [])
      setError(null)
    } catch (err: any) {
      console.error('Error fetching logs:', err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filterType, filterStatus, searchTerm, supabase])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleRefresh = async () => {
    await fetchLogs()
  }

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
    return type === 'email' ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'
  }

  if (loading && !refreshing) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto mb-4 h-8 w-8 animate-spin text-gray-400" />
          <p className="text-gray-600">Loading communication logs...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-center">
          <AlertCircle className="mr-2 h-5 w-5 text-red-400" />
          <p className="text-red-800">Error loading logs: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Communication Logs</h1>
        <ButtonGroup refreshing={refreshing} onRefresh={handleRefresh} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-64 rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Search recipient or assessment"
          />
        </div>

        <FilterSelect
          label="Type"
          value={filterType}
          onChange={(value) => setFilterType(value as 'all' | 'email' | 'sms')}
          options={[
            { value: 'all', label: 'All types' },
            { value: 'email', label: 'Email' },
            { value: 'sms', label: 'SMS' },
          ]}
        />

        <FilterSelect
          label="Status"
          value={filterStatus}
          onChange={(value) => setFilterStatus(value as typeof filterStatus)}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'sent', label: 'Sent' },
            { value: 'delivered', label: 'Delivered' },
            { value: 'failed', label: 'Failed' },
            { value: 'bounced', label: 'Bounced' },
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <HeaderCell>Time</HeaderCell>
              <HeaderCell>Type</HeaderCell>
              <HeaderCell>Status</HeaderCell>
              <HeaderCell>Recipient</HeaderCell>
              <HeaderCell>Subject/Message</HeaderCell>
              <HeaderCell>Assessment ID</HeaderCell>
              <HeaderCell>Error</HeaderCell>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeBadgeClass(log.type)}`}>
                      {log.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(log.status)}`}>
                      {getStatusIcon(log.status)}
                      <span className="ml-1 capitalize">{log.status}</span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{log.recipient}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">{log.subject || log.message || '-'}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <code className="rounded bg-gray-100 px-2 py-1 text-xs">
                      {log.assessment_id?.slice(0, 8)}
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

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Total Logs" value={logs.length.toString()} icon={<Activity className="h-8 w-8 text-gray-400" />} />
        <StatCard
          label="Delivered"
          value={logs.filter((log) => log.status === 'delivered').length.toString()}
          icon={<CheckCircle className="h-8 w-8 text-green-500" />}
        />
        <StatCard
          label="Failed"
          value={logs.filter((log) => log.status === 'failed' || log.status === 'bounced').length.toString()}
          icon={<XCircle className="h-8 w-8 text-red-500" />}
        />
        <StatCard
          label="Success Rate"
          value={
            logs.length > 0
              ? `${Math.round((logs.filter((log) => log.status === 'delivered' || log.status === 'sent').length / logs.length) * 100)}%`
              : '0%'
          }
          icon={<CheckCircle className="h-8 w-8 text-blue-500" />}
        />
      </div>
    </div>
  )
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">{children}</th>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-600">
      <span className="flex items-center gap-1 text-gray-500">
        <Filter className="h-4 w-4" />
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function ButtonGroup({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) {
  return (
    <button
      onClick={onRefresh}
      disabled={refreshing}
      className="flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
      {refreshing ? 'Refreshing...' : 'Refresh'}
    </button>
  )
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  )
}
