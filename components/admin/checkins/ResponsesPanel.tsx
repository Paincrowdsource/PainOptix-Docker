'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Mail } from 'lucide-react'

interface ResponseRecord {
  id: string
  assessment_id: string
  day: number
  value: 'better' | 'same' | 'worse'
  note: string | null
  pain_score?: number | null
  source?: string | null
  created_at: string
  assessment?: {
    email?: string | null
    diagnosis_code?: string | null
    guide_type?: string | null
  } | null
}

interface ResponsesPanelProps {
  responses: ResponseRecord[]
  onExport: () => void
}

const VALUE_LABELS: Record<ResponseRecord['value'], string> = {
  better: 'Feeling better',
  same: 'About the same',
  worse: 'Feeling worse',
}

export default function ResponsesPanel({ responses, onExport }: ResponsesPanelProps) {
  const [dayFilter, setDayFilter] = useState<number | 'all'>('all')
  const [valueFilter, setValueFilter] = useState<ResponseRecord['value'] | 'all'>('all')
  const [search, setSearch] = useState('')

  const filteredResponses = useMemo(() => {
    return responses.filter((response) => {
      if (dayFilter !== 'all' && response.day !== dayFilter) {
        return false
      }

      if (valueFilter !== 'all' && response.value !== valueFilter) {
        return false
      }

      if (!search.trim()) {
        return true
      }

      const token = search.trim().toLowerCase()
      const email = response.assessment?.email || ''
      const diagnosis = response.assessment?.diagnosis_code || response.assessment?.guide_type || ''
      const note = response.note || ''

      return (
        response.assessment_id.toLowerCase().includes(token) ||
        email.toLowerCase().includes(token) ||
        diagnosis.toLowerCase().includes(token) ||
        note.toLowerCase().includes(token)
      )
    })
  }, [responses, dayFilter, valueFilter, search])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Responses</h2>
          <p className="text-sm text-gray-600">
            {filteredResponses.length} of {responses.length} responses shown.
          </p>
        </div>
        <Button variant="outline" onClick={onExport} disabled={responses.length === 0}>
          Export filtered CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={dayFilter}
          onChange={(event) => {
            const value = event.target.value
            setDayFilter(value === 'all' ? 'all' : Number(value) as 3 | 7 | 14)
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="all">All days</option>
          <option value="3">Day 3</option>
          <option value="7">Day 7</option>
          <option value="14">Day 14</option>
        </select>

        <select
          value={valueFilter}
          onChange={(event) => setValueFilter(event.target.value as ResponsesPanelProps['responses'][number]['value'] | 'all')}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="all">All outcomes</option>
          <option value="better">Feeling better</option>
          <option value="same">About the same</option>
          <option value="worse">Feeling worse</option>
        </select>

        <input
          type="search"
          placeholder="Filter by email, diagnosis, note, or ID"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="min-w-[240px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Day</th>
              <th className="px-4 py-3 text-left">Pain</th>
              <th className="px-4 py-3 text-left">Outcome</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-left">Recipient</th>
              <th className="px-4 py-3 text-left">Diagnosis</th>
              <th className="px-4 py-3 text-left">Note</th>
              <th className="px-4 py-3 text-left">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {filteredResponses.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                  No responses match the current filters.
                </td>
              </tr>
            )}

            {filteredResponses.map((response) => {
              const email = response.assessment?.email || 'Hidden'
              const diagnosis = response.assessment?.diagnosis_code || response.assessment?.guide_type || 'Unknown'
              const created = formatDistanceToNow(new Date(response.created_at), {
                addSuffix: true,
              })

              return (
                <tr key={response.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Day {response.day}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {response.pain_score != null ? (
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        response.pain_score <= 3 ? 'bg-green-100 text-green-700' :
                        response.pain_score <= 6 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {response.pain_score}
                      </span>
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        response.value === 'better'
                          ? 'bg-green-100 text-green-700'
                          : response.value === 'same'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {VALUE_LABELS[response.value]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {response.source === 'sms_reply' ? (
                      <span title="SMS reply"><MessageSquare className="h-4 w-4 text-green-600" /></span>
                    ) : response.source === 'email_link' ? (
                      <span title="Email link"><Mail className="h-4 w-4 text-blue-600" /></span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{diagnosis}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {response.note ? response.note.substring(0, 120) : '--'}
                    {response.note && response.note.length > 120 ? '...' : ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{created}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
