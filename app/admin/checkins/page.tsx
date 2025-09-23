'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import Stats from './Stats'
import CheckInsTable from './CheckInsTable'
import OverviewPanel from '@/components/admin/checkins/OverviewPanel'
import ManualTriggerPanel from '@/components/admin/checkins/ManualTriggerPanel'
import ResponsesPanel from '@/components/admin/checkins/ResponsesPanel'
import TemplateManager from '@/components/admin/checkins/TemplateManager'
import AnalyticsPanel from '@/components/admin/checkins/AnalyticsPanel'
import HealthStatus from "@/components/admin/checkins/HealthStatus"
import { AlertCircle, CheckCircle } from 'lucide-react'

type CheckInValue = 'better' | 'same' | 'worse'
type TabKey = 'overview' | 'queue' | 'responses' | 'revenue' | 'manual' | 'templates' | 'analytics'

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
    email?: string | undefined
    phone_number?: string | undefined
    diagnosis_code?: string | undefined
  } | undefined
}

interface CheckInResponse {
  id: string
  assessment_id: string
  day: number
  value: CheckInValue
  note: string | null
  created_at: string
  assessment?: {
    email?: string | null
    diagnosis_code?: string | null
    guide_type?: string | null
  } | null
}

interface RevenueEvent {
  id: string
  assessment_id: string
  source: string
  stripe_id: string | null
  amount_cents: number | null
  created_at: string
}

interface AssessmentSummary {
  id: string
  email: string | null
  guide_type: string | null
  diagnosis_code: string | null
  created_at: string
}

interface MessageTemplate {
  id: string
  key: string
  subject: string | null
  shell_text: string
  disclaimer_text: string
  cta_url: string | null
  channel: string
  created_at: string
}

interface DiagnosisInsert {
  id: string
  diagnosis_code: string
  day: number
  branch: string
  insert_text: string
}

interface StatsState {
  dueNow: number
  sent24h: number
  failed24h: number
  responses24h: number
  revenue24h: number
}

interface FlashMessage {
  type: 'success' | 'error'
  message: string
}

export default function CheckInsPage() {
  const supabase = createSupabaseBrowserClient()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [flash, setFlash] = useState<FlashMessage | null>(null)
  const [queueItems, setQueueItems] = useState<CheckInQueueItem[]>([])
  const [responses, setResponses] = useState<CheckInResponse[]>([])
  const [revenue, setRevenue] = useState<RevenueEvent[]>([])
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([])
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [inserts, setInserts] = useState<DiagnosisInsert[]>([])
  const [stats, setStats] = useState<StatsState>({
    dueNow: 0,
    sent24h: 0,
    failed24h: 0,
    responses24h: 0,
    revenue24h: 0,
  })
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [loadingAssessments, setLoadingAssessments] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [hasLoadedAssessments, setHasLoadedAssessments] = useState(false)
  const [hasLoadedTemplates, setHasLoadedTemplates] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setLoadError(null)

      const now = new Date()
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const { data: queueData, error: queueError } = await supabase
        .from('check_in_queue')
        .select('*')
        .order('due_at', { ascending: true })

      if (queueError) {
        throw queueError
      }

      // Fetch assessments data separately for queue items
      const assessmentIds = Array.from(new Set(queueData?.map(item => item.assessment_id) || []))
      let assessmentsMap: Record<string, any> = {}

      if (assessmentIds.length > 0) {
        const { data: assessmentsData } = await supabase
          .from('assessments')
          .select('id, email, phone_number, diagnosis_code')
          .in('id', assessmentIds)

        assessmentsMap = (assessmentsData || []).reduce((acc, assessment) => {
          acc[assessment.id] = assessment
          return acc
        }, {} as Record<string, any>)
      }

      const enrichedQueueData = (queueData || []).map(item => ({
        ...item,
        assessment: assessmentsMap[item.assessment_id] || null
      }))

      setQueueItems(enrichedQueueData as CheckInQueueItem[])

      const { data: responseData, error: responseError } = await supabase
        .from('check_in_responses')
        .select('*')
        .order('created_at', { ascending: false })

      if (responseError) {
        throw responseError
      }

      // Fetch assessments data separately for responses
      const responseAssessmentIds = Array.from(new Set(responseData?.map(item => item.assessment_id) || []))
      let responseAssessmentsMap: Record<string, any> = {}

      if (responseAssessmentIds.length > 0) {
        const { data: responseAssessmentsData } = await supabase
          .from('assessments')
          .select('id, email, diagnosis_code, guide_type')
          .in('id', responseAssessmentIds)

        responseAssessmentsMap = (responseAssessmentsData || []).reduce((acc, assessment) => {
          acc[assessment.id] = assessment
          return acc
        }, {} as Record<string, any>)
      }

      const enrichedResponseData = (responseData || []).map(item => ({
        ...item,
        assessment: responseAssessmentsMap[item.assessment_id] || null
      }))

      setResponses(enrichedResponseData as CheckInResponse[])

      const { data: revenueData, error: revenueError } = await supabase
        .from('revenue_events')
        .select('*')
        .like('source', 'checkin_%')
        .order('created_at', { ascending: false })

      if (revenueError) {
        throw revenueError
      }
      setRevenue((revenueData || []) as RevenueEvent[])

      const dueNow =
        queueData?.filter(
          (item) => item.status === 'queued' && new Date(item.due_at) <= now,
        ).length || 0

      const sent24h =
        queueData?.filter(
          (item) =>
            item.status === 'sent' &&
            item.sent_at &&
            new Date(item.sent_at) >= twentyFourHoursAgo,
        ).length || 0

      const failed24h =
        queueData?.filter(
          (item) =>
            item.status === 'failed' &&
            item.sent_at &&
            new Date(item.sent_at) >= twentyFourHoursAgo,
        ).length || 0

      const responses24h =
        responseData?.filter(
          (item) => new Date(item.created_at) >= twentyFourHoursAgo,
        ).length || 0

      const revenue24h =
        revenueData
          ?.filter((item) => new Date(item.created_at) >= twentyFourHoursAgo)
          .reduce((sum, item) => sum + (item.amount_cents || 0), 0) || 0

      setStats({
        dueNow,
        sent24h,
        failed24h,
        responses24h,
        revenue24h,
      })
    } catch (error: any) {
      console.error('Error loading check-ins data:', error)
      setLoadError(error?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const handleAssessmentsLoad = useCallback(async () => {
    try {
      setLoadingAssessments(true)
      const { data, error } = await supabase
        .from('assessments')
        .select('id, email, guide_type, diagnosis_code, created_at')
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) {
        throw error
      }

      setAssessments((data || []) as AssessmentSummary[])
      setHasLoadedAssessments(true)
    } catch (error: any) {
      console.error('Error loading assessments for manual trigger:', error)
      setFlash({
        type: 'error',
        message: error?.message || 'Failed to load assessments',
      })
    } finally {
      setLoadingAssessments(false)
    }
  }, [supabase])

  const handleTemplatesLoad = useCallback(async () => {
    try {
      setLoadingTemplates(true)
      const [templatesResponse, insertsResponse] = await Promise.all([
        supabase
          .from('message_templates')
          .select('*')
          .order('key', { ascending: true }),
        supabase
          .from('diagnosis_inserts')
          .select('*')
          .order('diagnosis_code', { ascending: true })
          .order('day', { ascending: true })
          .order('branch', { ascending: true }),
      ])

      if (templatesResponse.error) {
        throw templatesResponse.error
      }
      if (insertsResponse.error) {
        throw insertsResponse.error
      }

      setTemplates((templatesResponse.data || []) as MessageTemplate[])
      setInserts((insertsResponse.data || []) as DiagnosisInsert[])
      setHasLoadedTemplates(true)
    } catch (error: any) {
      console.error('Error loading templates/inserts:', error)
      setFlash({
        type: 'error',
        message: error?.message || 'Failed to load template data',
      })
    } finally {
      setLoadingTemplates(false)
    }
  }, [supabase])

  const handleTemplateUpdated = useCallback((updated: MessageTemplate) => {
    setTemplates((prev) => {
      const exists = prev.find((template) => template.id === updated.id)
      if (exists) {
        return prev.map((template) =>
          template.id === updated.id ? updated : template,
        )
      }

      return [...prev, updated].sort((a, b) => a.key.localeCompare(b.key))
    })
  }, [])

  const handleInsertUpdated = useCallback((updated: DiagnosisInsert) => {
    setInserts((prev) => {
      const exists = prev.find((insert) => insert.id === updated.id)
      if (exists) {
        return prev.map((insert) =>
          insert.id === updated.id ? updated : insert,
        )
      }

      return [...prev, updated].sort((a, b) => {
        if (a.diagnosis_code === b.diagnosis_code) {
          if (a.day === b.day) {
            return a.branch.localeCompare(b.branch)
          }
          return a.day - b.day
        }
        return a.diagnosis_code.localeCompare(b.diagnosis_code)
      })
    })
  }, [])

  const handleResponseExport = useCallback(() => {
    if (!responses.length) {
      setFlash({
        type: 'error',
        message: 'No responses available to export',
      })
      return
    }

    const header = [
      'assessment_id',
      'day',
      'value',
      'note',
      'created_at',
      'email',
      'diagnosis_code',
      'guide_type',
    ]

    const rows = responses.map((response) => [
      response.assessment_id,
      response.day,
      response.value,
      response.note ? `"${response.note.replace(/"/g, '""')}"` : '',
      response.created_at,
      response.assessment?.email || '',
      response.assessment?.diagnosis_code || '',
      response.assessment?.guide_type || '',
    ])

    const csv = [header.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `checkins-responses-${new Date()
      .toISOString()
      .split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)

    setFlash({ type: 'success', message: 'Responses exported to CSV' })
  }, [responses])

  const handleManualQueued = useCallback(
    async (message: string) => {
      setFlash({ type: 'success', message })
      await loadData()
    },
    [loadData],
  )

  const handleDispatchDryRun = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/checkins/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        body: JSON.stringify({ dryRun: true }),
        },
      })

      if (!response.ok) {
        throw new Error('Dispatch dry run failed')
      }

      const payload = await response.json()
      const summary = payload.result ?? payload
      setFlash({
        type: 'success',
        message: `Dry run: ${summary.sent ?? 0} would send, ${summary.skipped ?? 0} skipped`,
      })
      await loadData()
    } catch (error: any) {
      console.error('Dispatch dry run error:', error)
      setFlash({
        type: 'error',
        message: error?.message || 'Dispatch dry run failed',
      })
    }
  }, [loadData])

  const handleDispatchNow = useCallback(async () => {
    if (!confirm('Are you sure you want to dispatch all due check-ins?')) {
      return
    }

    try {
      const response = await fetch('/api/admin/checkins/dispatch', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dryRun: false }),
        },
      })

      if (!response.ok) {
        throw new Error('Dispatch failed')
      }

      const payload = await response.json()
      const summary = payload.result ?? payload
      setFlash({
        type: 'success',
        message: `Dispatch complete: ${summary.sent ?? 0} sent, ${summary.failed ?? 0} failed`,
      })
      await loadData()
    } catch (error: any) {
      console.error('Dispatch error:', error)
      setFlash({
        type: 'error',
        message: error?.message || 'Dispatch failed',
      })
    }
  }, [loadData])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (activeTab === 'manual' && !hasLoadedAssessments && !loadingAssessments) {
      handleAssessmentsLoad()
    }

    if (activeTab === 'templates' && !hasLoadedTemplates && !loadingTemplates) {
      handleTemplatesLoad()
    }
  }, [
    activeTab,
    handleAssessmentsLoad,
    handleTemplatesLoad,
    hasLoadedAssessments,
    hasLoadedTemplates,
    loadingAssessments,
    loadingTemplates,
  ])

  useEffect(() => {
    if (!flash) {
      return
    }

    const timer = window.setTimeout(() => setFlash(null), 5000)
    return () => window.clearTimeout(timer)
  }, [flash])

  const tabs = useMemo(
    () => [
      { id: 'overview' as const, label: 'Overview' },
      { id: 'queue' as const, label: 'Queue', badge: queueItems.length },
      { id: 'responses' as const, label: 'Responses', badge: responses.length },
      { id: 'revenue' as const, label: 'Revenue' },
      { id: 'manual' as const, label: 'Manual Trigger' },
      { id: 'templates' as const, label: 'Templates & Inserts' },
      { id: 'analytics' as const, label: 'Analytics' },
    ],
    [queueItems.length, responses.length],
  )

  const totalRevenue = useMemo(() => {
    return revenue.reduce(
      (sum, record) => sum + (record.amount_cents || 0),
      0,
    ) / 100
  }, [revenue])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Coaching Check-Ins</h1>
        <p className="mt-1 text-gray-600">
          Monitor queue health, user responses, and messaging content for the coaching follow-ups.
        </p>
      </div>

      {flash && (
        <div
          className={`mb-4 flex items-start gap-3 rounded-lg border p-4 text-sm ${
            flash.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {flash.type === 'success' ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <div>
            <p className="font-medium">
              {flash.type === 'success' ? 'Success' : 'Action required'}
            </p>
            <p>{flash.message}</p>
          </div>
        </div>
      )}

      {loadError && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Unable to load dashboard data</p>
            <p>{loadError}</p>
          </div>
        </div>
      )}

      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {typeof tab.badge === 'number' && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {loading ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
          Loading check-in data…
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <HealthStatus />
              <Stats {...stats} />
              <OverviewPanel
                queueItems={queueItems}
                responses={responses}
                revenue={revenue}
                onExportResponses={handleResponseExport}
              />
            </div>
          )}

          {activeTab === 'queue' && (
            <CheckInsTable
              items={queueItems}
              onDispatchDryRun={handleDispatchDryRun}
              onDispatchNow={handleDispatchNow}
              onRefresh={loadData}
            />
          )}

          {activeTab === 'responses' && (
            <ResponsesPanel
              responses={responses}
              onExport={handleResponseExport}
            />
          )}

          {activeTab === 'revenue' && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-semibold mb-4">Revenue Attribution</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[3, 7, 14].map((day) => {
                  const dayRevenue = revenue.filter(
                    (record) => record.source === `checkin_d${day}`,
                  )
                  const total = dayRevenue.reduce(
                    (sum, record) => sum + (record.amount_cents || 0),
                    0,
                  )

                  return (
                    <div
                      key={day}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <h4 className="mb-2 font-semibold text-gray-900">
                        Day {day} check-ins
                      </h4>
                      <div className="text-2xl font-bold text-purple-600">
                        ${(total / 100).toFixed(2)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {dayRevenue.length} purchase{dayRevenue.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  )
                })}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                <span className="text-lg font-semibold text-gray-900">
                  Total attributed revenue
                </span>
                <span className="text-2xl font-bold text-purple-600">
                  ${totalRevenue.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'manual' && (
            <ManualTriggerPanel
              assessments={assessments}
              loading={loadingAssessments}
              hasLoaded={hasLoadedAssessments}
              onLoad={handleAssessmentsLoad}
              onQueue={handleManualQueued}
              onError={(message) => setFlash({ type: 'error', message })}
            />
          )}

          {activeTab === 'templates' && (
            <TemplateManager
              templates={templates}
              inserts={inserts}
              loading={loadingTemplates}
              hasLoaded={hasLoadedTemplates}
              onLoad={handleTemplatesLoad}
              onTemplateUpdated={handleTemplateUpdated}
              onInsertUpdated={handleInsertUpdated}
              onSuccess={(message) => setFlash({ type: 'success', message })}
              onError={(message) => setFlash({ type: 'error', message })}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPanel
              queueItems={queueItems}
              responses={responses}
              revenue={revenue}
            />
          )}
        </>
      )}
    </div>
  )
}
