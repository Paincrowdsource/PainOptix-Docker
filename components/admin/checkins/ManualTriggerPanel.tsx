'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

interface AssessmentSummary {
  id: string
  email: string | null
  guide_type: string | null
  diagnosis_code: string | null
  created_at: string
}

interface ManualTriggerPanelProps {
  assessments: AssessmentSummary[]
  loading: boolean
  hasLoaded: boolean
  onLoad: () => void | Promise<void>
  onQueue: (message: string) => void | Promise<void>
  onError: (message: string) => void
}

type BranchOption = 'initial' | 'better' | 'same' | 'worse'

export default function ManualTriggerPanel({
  assessments,
  loading,
  hasLoaded,
  onLoad,
  onQueue,
  onError,
}: ManualTriggerPanelProps) {
  const [selectedAssessment, setSelectedAssessment] = useState<string>('')
  const [day, setDay] = useState<number>(3)
  const [branch, setBranch] = useState<BranchOption>('initial')
  const [search, setSearch] = useState('')
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredAssessments = useMemo(() => {
    if (!search.trim()) {
      return assessments
    }
    const lower = search.trim().toLowerCase()
    return assessments.filter((assessment) => {
      return (
        assessment.id.toLowerCase().includes(lower) ||
        (assessment.email || '').toLowerCase().includes(lower) ||
        (assessment.diagnosis_code || '').toLowerCase().includes(lower)
      )
    })
  }, [assessments, search])

  const assessmentDetails = useMemo(() => {
    return assessments.find((item) => item.id === selectedAssessment) || null
  }, [assessments, selectedAssessment])

  const handlePreview = async () => {
    if (!selectedAssessment) {
      onError('Select an assessment before generating a preview.')
      return
    }

    setIsPreviewing(true)
    setPreviewHtml(null)
    try {
      const response = await fetch('/api/admin/checkins/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'preview',
          assessmentId: selectedAssessment,
          day,
          branch,
        }),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Preview failed')
      }

      const data = await response.json()
      setPreviewHtml(data.html || '')
    } catch (error: any) {
      console.error('Manual trigger preview error:', error)
      onError(error?.message || 'Unable to generate preview')
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleQueue = async () => {
    if (!selectedAssessment) {
      onError('Select an assessment before queueing a check-in.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/checkins/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'queue',
          assessmentId: selectedAssessment,
          day,
          branch,
        }),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Queueing failed')
      }

      const data = await response.json()
      await onQueue(data.message || 'Check-in queued for dispatch')
      setPreviewHtml(null)
    } catch (error: any) {
      console.error('Manual trigger queue error:', error)
      onError(error?.message || 'Unable to queue check-in')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Manual check-in trigger</h2>
            <p className="mt-1 text-sm text-gray-600">
              Queue a specific message for QA or one-off outreach. Manual entries respect dispatch tokens and sandbox settings.
            </p>
          </div>
          <Button onClick={() => onLoad()} disabled={loading} variant="outline">
            {loading ? 'Loading…' : hasLoaded ? 'Refresh list' : 'Load recent assessments'}
          </Button>
        </div>

        {hasLoaded && assessments.length === 0 && !loading && (
          <p className="mt-4 rounded border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
            No assessments found. Complete a new assessment first, then refresh this list.
          </p>
        )}

        {assessments.length > 0 && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Search assessments
                </label>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Filter by email, diagnosis, or ID"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Assessment
                </label>
                <div className="mt-1 max-h-64 overflow-y-auto rounded-md border border-gray-200">
                  <ul className="divide-y divide-gray-200 text-sm">
                    {filteredAssessments.map((assessment) => {
                      const isActive = assessment.id === selectedAssessment
                      return (
                        <li key={assessment.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedAssessment(assessment.id)}
                            className={`flex w-full flex-col items-start px-3 py-2 text-left transition ${
                              isActive
                                ? 'bg-blue-50 text-blue-900'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <span className="font-medium">
                              {assessment.email || 'No email recorded'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {assessment.diagnosis_code || assessment.guide_type || 'Diagnosis pending'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(assessment.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                    {filteredAssessments.length === 0 && (
                      <li className="px-3 py-2 text-xs text-gray-500">
                        No matches for &quot;<span className="font-mono">{search}</span>&quot;.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Day
                  </label>
                  <select
                    value={day}
                    onChange={(event) => setDay(Number(event.target.value) as 3 | 7 | 14)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    {[3, 7, 14].map((value) => (
                      <option key={value} value={value}>
                        Day {value}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Branch
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                    {(['initial', 'better', 'same', 'worse'] as BranchOption[]).map((option) => {
                      const isActive = branch === option
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setBranch(option)}
                          className={`rounded-md border px-3 py-2 capitalize transition ${
                            isActive
                              ? 'border-blue-500 bg-blue-600 text-white shadow'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {assessmentDetails && (
                <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  <p>
                    <span className="font-medium text-gray-800">Selected:</span>{' '}
                    {assessmentDetails.email || 'No email recorded'}
                  </p>
                  <p className="mt-1">
                    <span className="font-medium text-gray-800">Diagnosis:</span>{' '}
                    {assessmentDetails.diagnosis_code || assessmentDetails.guide_type || 'Not mapped'}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handlePreview} disabled={!selectedAssessment || isPreviewing} variant="outline">
                  {isPreviewing ? 'Generating preview…' : 'Preview message'}
                </Button>
                <Button onClick={handleQueue} disabled={!selectedAssessment || isSubmitting}>
                  {isSubmitting ? 'Queueing…' : 'Queue for dispatch'}
                </Button>
              </div>

              {previewHtml && (
                <div className="rounded-lg border border-gray-200 bg-white shadow">
                  <div className="border-b border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">
                    Preview
                  </div>
                  <div
                    className="max-h-96 overflow-y-auto bg-white px-4 py-3 text-sm"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

