'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, XCircle, RefreshCw } from 'lucide-react'

interface HealthData {
  status: 'healthy' | 'degraded' | 'not_ready' | 'error'
  timestamp: string
  queue: {
    total: number
    queued: number
    dueNow: number
    sent: number
    failed: number
  }
  activity: {
    lastSentAt: string | null
    responsesLast24h: number
    totalAlerts: number
  }
  configuration: {
    flags: {
      enabled: boolean
      sandbox: boolean
      autowire: boolean
      dispatchTokenSet: boolean
      tokenSecretSet: boolean
      sendTz: string
      sendWindow: string
      startAt: string
      alertWebhook: boolean
    }
    readiness: {
      hasTokenSecret: boolean
      hasDispatchToken: boolean
      hasContent: boolean
      isConfigured: boolean
    }
  }
}

export default function HealthStatus() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/checkins/health')

      if (!response.ok) {
        throw new Error('Failed to fetch health status')
      }

      const data = await response.json()
      setHealth(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    // Refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !health) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-gray-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading health status...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
        <div className="flex items-start gap-2">
          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Health Check Failed</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchHealth}
              className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!health) return null

  const statusIcon = {
    healthy: <CheckCircle className="h-5 w-5 text-green-500" />,
    degraded: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    not_ready: <XCircle className="h-5 w-5 text-red-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />
  }[health.status]

  const statusLabel = {
    healthy: 'System Healthy',
    degraded: 'System Degraded',
    not_ready: 'Configuration Required',
    error: 'System Error'
  }[health.status]

  const statusColor = {
    healthy: 'text-green-900',
    degraded: 'text-yellow-900',
    not_ready: 'text-red-900',
    error: 'text-red-900'
  }[health.status]

  const bgColor = {
    healthy: 'bg-green-50 border-green-200',
    degraded: 'bg-yellow-50 border-yellow-200',
    not_ready: 'bg-red-50 border-red-200',
    error: 'bg-red-50 border-red-200'
  }[health.status]

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000)

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className={`rounded-lg border p-6 shadow-sm ${bgColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {statusIcon}
          <div>
            <h3 className={`font-semibold ${statusColor}`}>{statusLabel}</h3>
            <p className="text-sm text-gray-600 mt-1">
              Last checked: {formatTime(health.timestamp)}
            </p>
          </div>
        </div>
        <button
          onClick={fetchHealth}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          title="Refresh health status"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Queue Status</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {health.queue.dueNow} due
          </p>
          <p className="text-xs text-gray-500">
            {health.queue.queued} queued, {health.queue.failed} failed
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Last Sent</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {formatTime(health.activity.lastSentAt)}
          </p>
          <p className="text-xs text-gray-500">
            {health.activity.responsesLast24h} responses (24h)
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Configuration</p>
          <div className="mt-1 space-y-1">
            <div className="flex items-center gap-1">
              {health.configuration.flags.enabled ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
              <span className="text-xs text-gray-700">
                {health.configuration.flags.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {health.configuration.flags.sandbox ? (
                <AlertCircle className="h-3 w-3 text-yellow-500" />
              ) : (
                <CheckCircle className="h-3 w-3 text-green-500" />
              )}
              <span className="text-xs text-gray-700">
                {health.configuration.flags.sandbox ? 'Sandbox Mode' : 'Live Mode'}
              </span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Readiness</p>
          <div className="mt-1 space-y-1">
            <div className="flex items-center gap-1">
              {health.configuration.readiness.hasTokenSecret ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
              <span className="text-xs text-gray-700">Token Secret</span>
            </div>
            <div className="flex items-center gap-1">
              {health.configuration.readiness.hasDispatchToken ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <AlertCircle className="h-3 w-3 text-yellow-500" />
              )}
              <span className="text-xs text-gray-700">
                {health.configuration.readiness.hasDispatchToken
                  ? 'Dispatch Token'
                  : 'Admin Proxy (Token Optional)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {health.status === 'not_ready' && (
        <div className="mt-4 p-3 bg-white/50 rounded border border-red-300">
          <p className="text-sm text-red-900 font-medium">Action Required:</p>
          <ul className="mt-1 text-xs text-red-700 space-y-1">
            {!health.configuration.readiness.hasTokenSecret && (
              <li>• Set CHECKINS_TOKEN_SECRET environment variable</li>
            )}
            {!health.configuration.readiness.hasDispatchToken && (
              <li>• Set CHECKINS_DISPATCH_TOKEN (optional - admin proxy available)</li>
            )}
            {!health.configuration.flags.enabled && (
              <li>• Set CHECKINS_ENABLED=1 to activate the system</li>
            )}
          </ul>
        </div>
      )}

      {health.activity.totalAlerts > 0 && (
        <div className="mt-4 p-3 bg-orange-50 rounded border border-orange-200">
          <p className="text-sm text-orange-900">
            <AlertCircle className="inline h-4 w-4 mr-1" />
            {health.activity.totalAlerts} red-flag alerts recorded
          </p>
        </div>
      )}
    </div>
  )
}