'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingDown, Clock, BarChart3, AlertCircle, Download, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface DropoffStats {
  totalStarted: number
  totalCompleted: number
  dropoffRate: number
  averageDropoffQuestion: number
  dropoffsByQuestion: { questionId: string; questionNumber: number; dropoffs: number; questionText: string }[]
  recentDropoffs: any[]
  problemQuestions: any[]
  peakDropoffTimes: any[]
}

export default function DropoffAnalytics() {
  const [stats, setStats] = useState<DropoffStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedInsights, setExpandedInsights] = useState(false)

  useEffect(() => {
    loadDropoffData()
  }, [])

  const loadDropoffData = async () => {
    try {
      // Get sessions from last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Get all sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('assessment_sessions')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })

      if (sessionsError) throw sessionsError

      // Calculate stats
      const totalStarted = sessions?.length || 0
      const completedSessions = sessions?.filter(s => s.completed_at !== null) || []
      const totalCompleted = completedSessions.length
      const incompleteSessions = sessions?.filter(s => s.completed_at === null) || []
      const dropoffRate = totalStarted > 0 ? ((totalStarted - totalCompleted) / totalStarted * 100) : 0

      // Calculate average drop-off question
      const dropoffQuestions = incompleteSessions
        .filter(s => s.drop_off_question_number !== null)
        .map(s => s.drop_off_question_number)
      const averageDropoffQuestion = dropoffQuestions.length > 0
        ? Math.round(dropoffQuestions.reduce((a, b) => a + b, 0) / dropoffQuestions.length)
        : 0

      // Get drop-offs by question
      const dropoffMap = new Map<string, { count: number; questionNumber: number; questionText: string }>()
      
      for (const session of incompleteSessions) {
        if (session.drop_off_question_id) {
          const key = session.drop_off_question_id
          if (!dropoffMap.has(key)) {
            // Get question text from progress records
            const { data: progressData } = await supabase
              .from('assessment_progress')
              .select('question_text')
              .eq('session_id', session.session_id)
              .eq('question_id', session.drop_off_question_id)
              .limit(1)
              .single()

            dropoffMap.set(key, {
              count: 0,
              questionNumber: session.drop_off_question_number || 0,
              questionText: progressData?.question_text || 'Unknown Question'
            })
          }
          const current = dropoffMap.get(key)!
          current.count++
        }
      }

      const dropoffsByQuestion = Array.from(dropoffMap.entries())
        .map(([questionId, data]) => ({
          questionId,
          questionNumber: data.questionNumber,
          dropoffs: data.count,
          questionText: data.questionText
        }))
        .sort((a, b) => a.questionNumber - b.questionNumber)

      // Get recent drop-offs (last 50)
      const recentDropoffs = incompleteSessions.slice(0, 50).map(session => ({
        id: session.id,
        sessionId: session.session_id,
        startTime: session.started_at,
        lastActive: session.last_active_at,
        questionsAnswered: session.questions_answered || 0,
        dropoffQuestion: session.drop_off_question_id,
        dropoffQuestionNumber: session.drop_off_question_number,
        timeSpent: session.time_spent_seconds || 0
      }))

      // Calculate problem questions (>20% drop-off rate)
      const problemQuestions = dropoffsByQuestion.filter(q => {
        const dropoffRateForQuestion = (q.dropoffs / totalStarted) * 100
        return dropoffRateForQuestion > 20
      })

      // Calculate peak drop-off times (hour of day analysis)
      const dropoffHours = incompleteSessions.map(s => {
        const hour = new Date(s.last_active_at).getHours()
        return hour
      })
      const hourCounts = dropoffHours.reduce((acc, hour) => {
        acc[hour] = (acc[hour] || 0) + 1
        return acc
      }, {} as Record<number, number>)
      
      const peakDropoffTimes = Object.entries(hourCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour, count]) => ({
          hour: parseInt(hour),
          count,
          timeLabel: `${hour}:00 - ${parseInt(hour) + 1}:00`
        }))

      setStats({
        totalStarted,
        totalCompleted,
        dropoffRate,
        averageDropoffQuestion,
        dropoffsByQuestion,
        recentDropoffs,
        problemQuestions,
        peakDropoffTimes
      })
    } catch (err) {
      console.error('Error loading drop-off data:', err)
      setError('Failed to load drop-off analytics')
    } finally {
      setLoading(false)
    }
  }

  const exportData = () => {
    if (!stats) return

    const csv = [
      ['Session ID', 'Start Time', 'Last Active', 'Questions Answered', 'Drop-off Question', 'Time Spent (seconds)'],
      ...stats.recentDropoffs.map(d => [
        d.sessionId.substring(0, 8),
        new Date(d.startTime).toLocaleString(),
        new Date(d.lastActive).toLocaleString(),
        d.questionsAnswered,
        `Q${d.dropoffQuestionNumber || 'N/A'}`,
        d.timeSpent
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dropoff-analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading drop-off analytics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Header with description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Drop-off Analytics</h3>
        <p className="text-sm text-blue-700">
          Track where users are leaving the assessment to identify potential issues with specific questions or the overall flow.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Started</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStarted}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Completed</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompleted}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalStarted > 0 ? Math.round((stats.totalCompleted / stats.totalStarted) * 100) : 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drop-off Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dropoffRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalStarted - stats.totalCompleted} users dropped off
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Drop-off Point</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Question {stats.averageDropoffQuestion}</div>
            <p className="text-xs text-muted-foreground">Most users leave here</p>
          </CardContent>
        </Card>
      </div>

      {/* Drop-off Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Drop-offs by Question</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.dropoffsByQuestion.map((item) => {
              const dropoffPercent = (item.dropoffs / stats.totalStarted) * 100
              const barColor = dropoffPercent > 20 ? 'bg-red-500' : dropoffPercent > 10 ? 'bg-yellow-500' : 'bg-green-500'
              
              return (
                <div key={item.questionId} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <span className="font-medium">Question {item.questionNumber}</span>
                      <span className="text-sm text-gray-600 ml-2">({item.dropoffs} drop-offs)</span>
                    </div>
                    <span className="text-sm font-medium">{dropoffPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${barColor}`}
                      style={{ width: `${Math.min(dropoffPercent * 5, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 truncate">{item.questionText}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Insights Section */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setExpandedInsights(!expandedInsights)}>
          <div className="flex justify-between items-center">
            <CardTitle>Key Insights</CardTitle>
            {expandedInsights ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </CardHeader>
        {expandedInsights && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Problem Questions */}
              <div>
                <h4 className="font-semibold mb-3 text-red-600">âš ï¸ Problem Questions</h4>
                {stats.problemQuestions.length > 0 ? (
                  <ul className="space-y-2">
                    {stats.problemQuestions.map((q) => (
                      <li key={q.questionId} className="text-sm">
                        <span className="font-medium">Question {q.questionNumber}</span> has a{' '}
                        <span className="text-red-600 font-semibold">
                          {((q.dropoffs / stats.totalStarted) * 100).toFixed(1)}%
                        </span>{' '}
                        drop-off rate - consider simplifying
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">No questions have concerning drop-off rates</p>
                )}
              </div>

              {/* Peak Drop-off Times */}
              <div>
                <h4 className="font-semibold mb-3">ðŸ• Peak Drop-off Times</h4>
                <ul className="space-y-2">
                  {stats.peakDropoffTimes.map((time, index) => (
                    <li key={time.hour} className="text-sm">
                      <span className="font-medium">{index + 1}.</span> {time.timeLabel} -{' '}
                      <span className="text-gray-600">{time.count} drop-offs</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recovery Opportunities */}
              <div className="md:col-span-2">
                <h4 className="font-semibold mb-3">ðŸ’¡ Recovery Opportunities</h4>
                <p className="text-sm text-gray-600">
                  {stats.recentDropoffs.filter(d => {
                    const hoursSince = (Date.now() - new Date(d.lastActive).getTime()) / (1000 * 60 * 60)
                    return hoursSince < 24
                  }).length} users dropped off in the last 24 hours and could potentially be re-engaged.
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Incomplete Assessments</CardTitle>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 text-sm font-medium text-gray-600">Session ID</th>
                  <th className="text-left p-2 text-sm font-medium text-gray-600">Start Time</th>
                  <th className="text-left p-2 text-sm font-medium text-gray-600">Last Active</th>
                  <th className="text-left p-2 text-sm font-medium text-gray-600">Questions Completed</th>
                  <th className="text-left p-2 text-sm font-medium text-gray-600">Drop-off Question</th>
                  <th className="text-left p-2 text-sm font-medium text-gray-600">Time Spent</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentDropoffs.map((dropoff) => (
                  <tr key={dropoff.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 text-sm font-mono">{dropoff.sessionId.substring(0, 8)}...</td>
                    <td className="p-2 text-sm">
                      {formatDistanceToNow(new Date(dropoff.startTime), { addSuffix: true })}
                    </td>
                    <td className="p-2 text-sm">
                      {formatDistanceToNow(new Date(dropoff.lastActive), { addSuffix: true })}
                    </td>
                    <td className="p-2 text-sm">
                      {dropoff.questionsAnswered} of ~16
                    </td>
                    <td className="p-2 text-sm">
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        Q{dropoff.dropoffQuestionNumber || 'N/A'}
                      </span>
                    </td>
                    <td className="p-2 text-sm text-gray-600">
                      {Math.floor(dropoff.timeSpent / 60)}m {dropoff.timeSpent % 60}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
