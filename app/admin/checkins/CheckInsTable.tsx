'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { RefreshCw, Eye, Send, TestTube } from 'lucide-react'

interface CheckInQueueItem {
  id: string
  assessment_id: string
  day: number
  due_at: string
  sent_at: string | null
  template_key: string
  channel: string
  status: string
  last_error: string | null
  assessment?: {
    email?: string
    phone_number?: string
    diagnosis_code?: string
  }
}

interface CheckInsTableProps {
  items: CheckInQueueItem[]
  onDispatchDryRun: () => void
  onDispatchNow: () => void
  onRefresh: () => void
}

export default function CheckInsTable({ items, onDispatchDryRun, onDispatchNow, onRefresh }: CheckInsTableProps) {
  const [dayFilter, setDayFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [channelFilter, setChannelFilter] = useState<string>('all')

  // Apply filters
  const filteredItems = items.filter(item => {
    if (dayFilter !== 'all' && item.day !== parseInt(dayFilter)) return false
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    if (channelFilter !== 'all' && item.channel !== channelFilter) return false
    return true
  })

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      queued: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      skipped: 'bg-gray-100 text-gray-800'
    }
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  const maskContact = (contact: string | undefined) => {
    if (!contact) return 'N/A'
    if (contact.includes('@')) {
      const [username, domain] = contact.split('@')
      return `${username.substring(0, 2)}***@${domain}`
    }
    return `***${contact.slice(-4)}`
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Days</option>
              <option value="3">Day 3</option>
              <option value="7">Day 7</option>
              <option value="14">Day 14</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="queued">Queued</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="skipped">Skipped</option>
            </select>

            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Channels</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onDispatchDryRun}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <TestTube className="h-4 w-4" />
              Dry Run
            </button>
            <button
              onClick={onDispatchNow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Send className="h-4 w-4" />
              Dispatch Now
            </button>
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Day
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Channel
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due At
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sent At
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Error
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No check-ins found
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    Day {item.day}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {maskContact(item.assessment?.email || item.assessment?.phone_number)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <span className="capitalize">{item.channel}</span>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDistanceToNow(new Date(item.due_at), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item.sent_at ? formatDistanceToNow(new Date(item.sent_at), { addSuffix: true }) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-red-600" title={item.last_error || undefined}>
                    {item.last_error ? item.last_error.substring(0, 30) + '...' : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-600">
        Showing {filteredItems.length} of {items.length} check-ins
      </div>
    </div>
  )
}
