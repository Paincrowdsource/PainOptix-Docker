'use client'

import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import { format, subDays } from 'date-fns'
import { Button } from '@/components/ui/button'

interface OverviewPanelProps {
  queueItems: Array<{
    status: string
    day: number
    due_at: string
    sent_at: string | null
  }>
  responses: Array<{
    day: number
    value: 'better' | 'same' | 'worse'
    created_at: string
    assessment?: {
      diagnosis_code?: string | null
      guide_type?: string | null
    } | null
  }>
  revenue: Array<{
    amount_cents: number | null
    created_at: string
  }>
  onExportResponses: () => void
}

type TrendBucket = {
  key: string
  label: string
  sent: number
  responses: number
  revenue: number
}

type ResponseBar = {
  label: string
  better: number
  same: number
  worse: number
}

const WINDOW_CHOICES = [7, 14, 30]

export default function OverviewPanel({
  queueItems,
  responses,
  revenue,
  onExportResponses,
}: OverviewPanelProps) {
  const [windowDays, setWindowDays] = useState<number>(14)

  const { queuedCount, overdueCount, sentCount, failedCount } = useMemo(() => {
    const now = new Date()
    let queued = 0
    let overdue = 0
    let sent = 0
    let failed = 0

    queueItems.forEach((item) => {
      if (item.status === 'queued') {
        queued += 1
        if (new Date(item.due_at) < now) {
          overdue += 1
        }
      }
      if (item.status === 'sent') {
        sent += 1
      }
      if (item.status === 'failed') {
        failed += 1
      }
    })

    return {
      queuedCount: queued,
      overdueCount: overdue,
      sentCount: sent,
      failedCount: failed,
    }
  }, [queueItems])

  const responseRate = useMemo(() => {
    if (!sentCount) {
      return 0
    }
    const ratio = (responses.length / sentCount) * 100
    return Number.isFinite(ratio) ? Math.min(100, ratio) : 0
  }, [responses.length, sentCount])

  const worseCount = useMemo(
    () => responses.filter((response) => response.value === 'worse').length,
    [responses],
  )

  const responseBarData: ResponseBar[] = useMemo(() => {
    const buckets: Record<number, ResponseBar> = {
      3: { label: 'Day 3', better: 0, same: 0, worse: 0 },
      7: { label: 'Day 7', better: 0, same: 0, worse: 0 },
      14: { label: 'Day 14', better: 0, same: 0, worse: 0 },
    }

    responses.forEach((response) => {
      if (!buckets[response.day]) {
        buckets[response.day] = {
          label: `Day ${response.day}`,
          better: 0,
          same: 0,
          worse: 0,
        }
      }

      buckets[response.day][response.value] += 1
    })

    return [3, 7, 14].map((day) => buckets[day])
  }, [responses])

  const timelineData: TrendBucket[] = useMemo(() => {
    const today = new Date()
    const buckets: TrendBucket[] = []
    const index = new Map<string, number>()

    for (let i = windowDays - 1; i >= 0; i -= 1) {
      const date = subDays(today, i)
      const key = format(date, 'yyyy-MM-dd')
      index.set(key, buckets.length)
      buckets.push({
        key,
        label: format(date, 'MMM d'),
        sent: 0,
        responses: 0,
        revenue: 0,
      })
    }

    responses.forEach((response) => {
      const key = format(new Date(response.created_at), 'yyyy-MM-dd')
      const bucketIndex = index.get(key)
      if (bucketIndex !== undefined) {
        buckets[bucketIndex].responses += 1
      }
    })

    queueItems.forEach((item) => {
      if (item.status === 'sent' && item.sent_at) {
        const key = format(new Date(item.sent_at), 'yyyy-MM-dd')
        const bucketIndex = index.get(key)
        if (bucketIndex !== undefined) {
          buckets[bucketIndex].sent += 1
        }
      }
    })

    revenue.forEach((record) => {
      const key = format(new Date(record.created_at), 'yyyy-MM-dd')
      const bucketIndex = index.get(key)
      if (bucketIndex !== undefined) {
        buckets[bucketIndex].revenue += (record.amount_cents || 0) / 100
      }
    })

    return buckets
  }, [queueItems, responses, revenue, windowDays])

  const revenue30d = useMemo(() => {
    const threshold = subDays(new Date(), 30)
    return (
      revenue
        .filter((record) => new Date(record.created_at) >= threshold)
        .reduce((sum, record) => sum + (record.amount_cents || 0), 0) / 100
    )
  }, [revenue])

  const topDiagnoses = useMemo(() => {
    const map = new Map<string, number>()

    responses.forEach((response) => {
      const key =
        response.assessment?.diagnosis_code ||
        response.assessment?.guide_type ||
        'unspecified'
      map.set(key, (map.get(key) || 0) + 1)
    })

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [responses])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
          <p className="text-sm text-gray-600">
            Activity and outcomes for the last {windowDays} days.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-md border border-gray-200 bg-white p-1 text-sm shadow-sm">
            {WINDOW_CHOICES.map((days) => {
              const isActive = windowDays === days
              return (
                <button
                  key={days}
                  type="button"
                  onClick={() => setWindowDays(days)}
                  className={`rounded px-3 py-1 font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {days}d
                </button>
              )
            })}
          </div>
          <Button variant="outline" onClick={onExportResponses}>
            Export responses CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Queued check-ins</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{queuedCount}</p>
          <p className="mt-1 text-xs text-gray-500">
            {overdueCount} overdue - {failedCount} failed in backlog
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Response rate</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {responseRate.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {responses.length} responses out of {sentCount || '0'} sent
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">"Feeling worse" replies</p>
          <p className="mt-2 text-2xl font-semibold text-orange-600">{worseCount}</p>
          <p className="mt-1 text-xs text-gray-500">Monitor for red-flag follow-up</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Revenue (30 days)</p>
          <p className="mt-2 text-2xl font-semibold text-purple-600">
            ${revenue30d.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Attributed to check-ins</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Response mix by day</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseBarData} stackOffset="expand">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip formatter={(value: number) => value.toString()} />
                <Legend />
                <Bar dataKey="better" stackId="responses" fill="#16a34a" radius={[6, 6, 0, 0]} />
                <Bar dataKey="same" stackId="responses" fill="#0ea5e9" radius={[0, 0, 0, 0]} />
                <Bar dataKey="worse" stackId="responses" fill="#f97316" radius={[0, 0, 6, 6]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Send & response timeline</h3>
            <span className="text-xs text-gray-500">Counts per day</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" allowDecimals={false} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  formatter={(value: number | string, name) => {
                    const numeric = typeof value === 'number' ? value : Number(value)
                    if (name === 'Revenue ($)') {
                      return [`$${numeric.toFixed(2)}`, name]
                    }
                    return [numeric.toFixed(0), name]
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="sent"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  name="Sent"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="responses"
                  stroke="#0f172a"
                  strokeWidth={2}
                  dot={false}
                  name="Responses"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#9333ea"
                  strokeWidth={2}
                  dot={false}
                  name="Revenue ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Queue status breakdown</h3>
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
            <div className="rounded-md bg-blue-50 p-3">
              <p className="text-xs uppercase text-blue-700">Queued</p>
              <p className="mt-1 text-lg font-semibold text-blue-900">{queuedCount}</p>
            </div>
            <div className="rounded-md bg-green-50 p-3">
              <p className="text-xs uppercase text-green-700">Sent</p>
              <p className="mt-1 text-lg font-semibold text-green-900">{sentCount}</p>
            </div>
            <div className="rounded-md bg-amber-50 p-3">
              <p className="text-xs uppercase text-amber-700">Overdue</p>
              <p className="mt-1 text-lg font-semibold text-amber-900">{overdueCount}</p>
            </div>
            <div className="rounded-md bg-rose-50 p-3">
              <p className="text-xs uppercase text-rose-700">Failed</p>
              <p className="mt-1 text-lg font-semibold text-rose-900">{failedCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Top diagnoses responding</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            {topDiagnoses.length === 0 && (
              <li className="rounded border border-dashed border-gray-200 p-3 text-center text-xs text-gray-400">
                No responses yet for this window.
              </li>
            )}
            {topDiagnoses.map(([diagnosis, count]) => (
              <li
                key={diagnosis}
                className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
              >
                <span className="font-medium text-gray-800">{diagnosis}</span>
                <span className="text-sm text-gray-500">{count} response{count === 1 ? '' : 's'}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
