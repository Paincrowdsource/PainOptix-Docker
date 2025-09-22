'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import { format, subDays } from 'date-fns'

interface QueueItem {
  status: string
  day: number
  due_at: string
  sent_at: string | null
}

interface ResponseRecord {
  id: string
  assessment_id: string
  day: number
  value: 'better' | 'same' | 'worse'
  note: string | null
  created_at: string
  assessment?: {
    email?: string | null
    diagnosis_code?: string | null
  } | null
}

interface RevenueRecord {
  amount_cents: number | null
  created_at: string
  source: string
}

interface AnalyticsPanelProps {
  queueItems: QueueItem[]
  responses: ResponseRecord[]
  revenue: RevenueRecord[]
}

export default function AnalyticsPanel({ queueItems, responses, revenue }: AnalyticsPanelProps) {
  const branchDistribution = useMemo(() => {
    const base = {
      better: 0,
      same: 0,
      worse: 0,
    }

    responses.forEach((response) => {
      base[response.value] += 1
    })

    return [
      { branch: 'Feeling better', value: base.better },
      { branch: 'About the same', value: base.same },
      { branch: 'Feeling worse', value: base.worse },
    ]
  }, [responses])

  const revenueTimeline = useMemo(() => {
    const today = new Date()
    const buckets: { key: string; label: string; revenue: number }[] = []
    const index = new Map<string, number>()

    for (let i = 29; i >= 0; i -= 1) {
      const date = subDays(today, i)
      const key = format(date, 'yyyy-MM-dd')
      index.set(key, buckets.length)
      buckets.push({ key, label: format(date, 'MMM d'), revenue: 0 })
    }

    revenue.forEach((record) => {
      const key = format(new Date(record.created_at), 'yyyy-MM-dd')
      const bucketIndex = index.get(key)
      if (bucketIndex !== undefined) {
        buckets[bucketIndex].revenue += (record.amount_cents || 0) / 100
      }
    })

    return buckets
  }, [revenue])

  const queueByDay = useMemo(() => {
    const map = new Map<string, { label: string; queued: number; sent: number; failed: number }>()
    queueItems.forEach((item) => {
      const key = format(new Date(item.due_at), 'yyyy-MM-dd')
      if (!map.has(key)) {
        map.set(key, {
          label: format(new Date(item.due_at), 'MMM d'),
          queued: 0,
          sent: 0,
          failed: 0,
        })
      }
      const bucket = map.get(key)!
      if (item.status === 'queued') {
        bucket.queued += 1
      } else if (item.status === 'sent') {
        bucket.sent += 1
      } else if (item.status === 'failed') {
        bucket.failed += 1
      }
    })

    return Array.from(map.values()).sort((a, b) => (a.label > b.label ? 1 : -1))
  }, [queueItems])

  const recentWorse = useMemo(() => {
    return responses
      .filter((response) => response.value === 'worse')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
  }, [responses])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Response distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="branch" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Revenue attribution (30 days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  formatter={(value: number | string) => {
                    const numeric = typeof value === 'number' ? value : Number(value)
                    return [`$${numeric.toFixed(2)}`, 'Revenue']
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#9333ea" strokeWidth={2} dot={false} name="Revenue ($)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Queue status over time</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={queueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="queued" stroke="#2563eb" strokeWidth={2} dot={false} name="Queued" />
              <Line type="monotone" dataKey="sent" stroke="#16a34a" strokeWidth={2} dot={false} name="Sent" />
              <Line type="monotone" dataKey="failed" stroke="#f97316" strokeWidth={2} dot={false} name="Failed" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Recent "feeling worse" responses</h3>
        <div className="overflow-x-auto text-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Assessment</th>
                <th className="px-4 py-3 text-left">Diagnosis</th>
                <th className="px-4 py-3 text-left">Day</th>
                <th className="px-4 py-3 text-left">Note</th>
                <th className="px-4 py-3 text-left">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentWorse.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    No "worse" responses recorded yet.
                  </td>
                </tr>
              )}
              {recentWorse.map((response) => (
                <tr key={response.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{response.assessment?.email || 'Hidden'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{response.assessment?.diagnosis_code || 'Unknown'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">Day {response.day}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {response.note ? response.note.substring(0, 160) : 'No note provided'}
                    {response.note && response.note.length > 160 ? '...' : ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {format(new Date(response.created_at), 'MMM d, yyyy HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
