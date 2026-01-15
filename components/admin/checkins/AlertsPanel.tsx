'use client'

import { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, X, Clock, User, FileText, ExternalLink, RefreshCw, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface RedFlagAlert {
  id: string
  assessment_id: string
  type: string
  payload: {
    day: number
    matched: string[]
    note_excerpt: string
  }
  created_at: string
  research_id: string | null
  email: string | null
  phone_number: string | null
  guide_type: string | null
}

interface AlertsPanelProps {
  onAlertCountChange?: (count: number) => void
}

export default function AlertsPanel({ onAlertCountChange }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<RedFlagAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dismissing, setDismissing] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/checkins/alerts', {
        credentials: 'include',
        headers: {
          'x-admin-password': 'P@inOpt!x#Adm1n2025$ecure'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch alerts')
      }

      const data = await response.json()
      setAlerts(data.alerts || [])
      onAlertCountChange?.(data.count || 0)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [onAlertCountChange])

  const dismissAlert = async (alertId: string) => {
    try {
      setDismissing(alertId)

      const response = await fetch('/api/admin/checkins/alerts', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': 'P@inOpt!x#Adm1n2025$ecure'
        },
        body: JSON.stringify({ alertId })
      })

      if (!response.ok) {
        throw new Error('Failed to dismiss alert')
      }

      // Remove from local state
      setAlerts(prev => {
        const newAlerts = prev.filter(a => a.id !== alertId)
        onAlertCountChange?.(newAlerts.length)
        return newAlerts
      })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setDismissing(null)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 text-gray-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading safety alerts...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Failed to load alerts</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchAlerts}
              className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-500" />
          <div>
            <h3 className="font-semibold text-green-900">No Active Safety Alerts</h3>
            <p className="text-sm text-green-700 mt-0.5">
              All patient check-in notes have been reviewed.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h3 className="font-semibold text-gray-900">
            Safety Alerts ({alerts.length})
          </h3>
        </div>
        <button
          onClick={fetchAlerts}
          className="text-gray-500 hover:text-gray-700 transition-colors p-1"
          title="Refresh alerts"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Alert Cards */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="rounded-lg border-2 border-red-200 bg-red-50 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Patient Info Row */}
                <div className="flex items-center gap-3 mb-2">
                  <User className="h-4 w-4 text-red-600 flex-shrink-0" />
                  {alert.research_id ? (
                    <span className="inline-flex items-center px-2 py-1 rounded bg-white border border-red-200">
                      <span className="font-mono font-bold text-red-700">
                        {alert.research_id}
                      </span>
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">No Research ID</span>
                  )}
                  {alert.email && (
                    <span className="text-sm text-gray-600 truncate">
                      {alert.email}
                    </span>
                  )}
                </div>

                {/* Matched Keywords */}
                <div className="mb-2">
                  <span className="text-xs font-medium text-red-700 uppercase tracking-wider">
                    Red Flag Keywords:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {alert.payload.matched.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Note Excerpt */}
                {alert.payload.note_excerpt && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Patient Note:
                    </span>
                    <p className="mt-1 text-sm text-gray-800 bg-white rounded p-2 border border-gray-200 italic">
                      "{alert.payload.note_excerpt}"
                    </p>
                  </div>
                )}

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Day {alert.payload.day} check-in
                  </span>
                  {alert.guide_type && (
                    <span className="capitalize">
                      {alert.guide_type.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                <a
                  href={`/admin/assessments?search=${alert.research_id || alert.assessment_id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Patient
                </a>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  disabled={dismissing === alert.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {dismissing === alert.id ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Dismissing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Mark Reviewed
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Warning Notice */}
      <div className="text-xs text-gray-500 bg-gray-50 rounded p-3 border border-gray-200">
        <strong>Note:</strong> These alerts are triggered when patients mention symptoms like
        bladder/bowel issues, numbness, or progressive weakness in their check-in notes.
        Consider following up with patients showing these red-flag symptoms.
      </div>
    </div>
  )
}
