'use client'

import { FormEvent, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'

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

interface TemplateManagerProps {
  templates: MessageTemplate[]
  inserts: DiagnosisInsert[]
  loading: boolean
  hasLoaded: boolean
  onLoad: () => void | Promise<void>
  onTemplateUpdated: (template: MessageTemplate) => void
  onInsertUpdated: (insert: DiagnosisInsert) => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

const BRANCH_LABELS: Record<string, string> = {
  initial: 'Initial',
  better: 'Feeling better',
  same: 'About the same',
  worse: 'Feeling worse',
}

export default function TemplateManager({
  templates,
  inserts,
  loading,
  hasLoaded,
  onLoad,
  onTemplateUpdated,
  onInsertUpdated,
  onSuccess,
  onError,
}: TemplateManagerProps) {
  const [searchTemplate, setSearchTemplate] = useState('')
  const [diagnosisFilter, setDiagnosisFilter] = useState('all')
  const [dayFilter, setDayFilter] = useState<number | 'all'>('all')
  const [branchFilter, setBranchFilter] = useState<string>('all')
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [editingInsert, setEditingInsert] = useState<DiagnosisInsert | null>(null)
  const [templateDraft, setTemplateDraft] = useState({
    subject: '',
    shell_text: '',
    disclaimer_text: '',
    cta_url: '',
  })
  const [insertDraft, setInsertDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const filteredTemplates = useMemo(() => {
    const token = searchTemplate.trim().toLowerCase()
    if (!token) {
      return templates
    }
    return templates.filter((template) => {
      return (
        template.key.toLowerCase().includes(token) ||
        (template.subject || '').toLowerCase().includes(token) ||
        template.shell_text.toLowerCase().includes(token)
      )
    })
  }, [templates, searchTemplate])

  const filteredInserts = useMemo(() => {
    return inserts.filter((insert) => {
      if (diagnosisFilter !== 'all' && insert.diagnosis_code !== diagnosisFilter) {
        return false
      }
      if (dayFilter !== 'all' && insert.day !== dayFilter) {
        return false
      }
      if (branchFilter !== 'all' && insert.branch !== branchFilter) {
        return false
      }
      return true
    })
  }, [inserts, diagnosisFilter, dayFilter, branchFilter])

  const uniqueDiagnoses = useMemo(() => {
    return Array.from(new Set(inserts.map((insert) => insert.diagnosis_code))).sort()
  }, [inserts])

  const openTemplateEditor = (template: MessageTemplate) => {
    setEditingTemplate(template)
    setTemplateDraft({
      subject: template.subject || '',
      shell_text: template.shell_text,
      disclaimer_text: template.disclaimer_text,
      cta_url: template.cta_url || '',
    })
  }

  const openInsertEditor = (insert: DiagnosisInsert) => {
    setEditingInsert(insert)
    setInsertDraft(insert.insert_text)
  }

  const closeEditors = () => {
    setEditingTemplate(null)
    setEditingInsert(null)
    setSubmitting(false)
  }

  const handleTemplateSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!editingTemplate) {
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/checkins/templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'template',
          id: editingTemplate.id,
          values: {
            subject: templateDraft.subject.trim() || null,
            shell_text: templateDraft.shell_text,
            disclaimer_text: templateDraft.disclaimer_text,
            cta_url: templateDraft.cta_url.trim() || null,
          },
        }),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Failed to update template')
      }

      const data = await response.json()
      onTemplateUpdated(data.template as MessageTemplate)
      onSuccess('Template updated successfully')
      closeEditors()
    } catch (error: any) {
      console.error('Template update error:', error)
      onError(error?.message || 'Unable to update template')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInsertSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!editingInsert) {
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/checkins/templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'insert',
          id: editingInsert.id,
          values: {
            insert_text: insertDraft,
          },
        }),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Failed to update insert')
      }

      const data = await response.json()
      onInsertUpdated(data.insert as DiagnosisInsert)
      onSuccess('Insert updated successfully')
      closeEditors()
    } catch (error: any) {
      console.error('Insert update error:', error)
      onError(error?.message || 'Unable to update insert')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Templates & inserts</h2>
            <p className="text-sm text-gray-600">
              Preview and edit the deterministic building blocks for coaching emails.
            </p>
          </div>
          <Button onClick={() => onLoad()} disabled={loading} variant="outline">
            {loading ? 'Loading...' : hasLoaded ? 'Refresh data' : 'Load content'}
          </Button>
        </div>

        {!hasLoaded && !loading && (
          <p className="mt-4 rounded border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
            Load the current templates from Supabase to begin editing.
          </p>
        )}

        {hasLoaded && (
          <div className="mt-6 space-y-8">
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Message templates
                  </h3>
                    <p className="text-xs text-gray-500">
                      One shell per day/branch. Placeholders: {"{{insert}}"} and {"{{encouragement}}"}.
                    </p>
                </div>
                <input
                  type="search"
                  placeholder="Search by key or subject"
                  value={searchTemplate}
                  onChange={(event) => setSearchTemplate(event.target.value)}
                  className="min-w-[220px] rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Key</th>
                      <th className="px-4 py-3 text-left">Subject</th>
                      <th className="px-4 py-3 text-left">Channel</th>
                      <th className="px-4 py-3 text-left" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {filteredTemplates.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                          No templates match the current search.
                        </td>
                      </tr>
                    )}
                    {filteredTemplates.map((template) => (
                      <tr key={template.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{template.key}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{template.subject || 'Untitled message'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 capitalize">{template.channel}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="outline" size="sm" onClick={() => openTemplateEditor(template)}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Diagnosis inserts
                  </h3>
                  <p className="text-xs text-gray-500">
                    Short client-approved inserts per diagnosis, day, and branch.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={diagnosisFilter}
                  onChange={(event) => setDiagnosisFilter(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="all">All diagnoses</option>
                  {uniqueDiagnoses.map((diagnosis) => (
                    <option key={diagnosis} value={diagnosis}>
                      {diagnosis}
                    </option>
                  ))}
                </select>

                <select
                  value={dayFilter}
                  onChange={(event) => {
                    const value = event.target.value
                    setDayFilter(value === 'all' ? 'all' : (Number(value) as 3 | 7 | 14))
                  }}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="all">All days</option>
                  <option value="3">Day 3</option>
                  <option value="7">Day 7</option>
                  <option value="14">Day 14</option>
                </select>

                <select
                  value={branchFilter}
                  onChange={(event) => setBranchFilter(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="all">All branches</option>
                  {(['initial', 'better', 'same', 'worse'] as const).map((branchOption) => (
                    <option key={branchOption} value={branchOption}>
                      {BRANCH_LABELS[branchOption]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Diagnosis</th>
                      <th className="px-4 py-3 text-left">Day</th>
                      <th className="px-4 py-3 text-left">Branch</th>
                      <th className="px-4 py-3 text-left">Insert</th>
                      <th className="px-4 py-3 text-left" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {filteredInserts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                          No inserts match the selected filters.
                        </td>
                      </tr>
                    )}
                    {filteredInserts.map((insert) => (
                      <tr key={insert.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{insert.diagnosis_code}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Day {insert.day}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{BRANCH_LABELS[insert.branch] || insert.branch}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{insert.insert_text}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="outline" size="sm" onClick={() => openInsertEditor(insert)}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>

      {(editingTemplate || editingInsert) && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
            {editingTemplate && (
              <form onSubmit={handleTemplateSubmit} className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Edit template ({editingTemplate.key})</h3>
                    <p className="text-sm text-gray-500">Update the subject, shell, or disclaimer text. Remember to keep placeholders intact.</p>
                  </div>
                  <Button type="button" variant="ghost" onClick={closeEditors}>
                    Close
                  </Button>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={templateDraft.subject}
                    onChange={(event) => setTemplateDraft((draft) => ({ ...draft, subject: event.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Optional email subject"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Shell text (includes {"{{insert}}"} & {"{{encouragement}}"})
                  </label>
                  <textarea
                    value={templateDraft.shell_text}
                    onChange={(event) => setTemplateDraft((draft) => ({ ...draft, shell_text: event.target.value }))}
                    rows={10}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Disclaimer text
                  </label>
                  <textarea
                    value={templateDraft.disclaimer_text}
                    onChange={(event) => setTemplateDraft((draft) => ({ ...draft, disclaimer_text: event.target.value }))}
                    rows={4}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    CTA URL (optional)
                  </label>
                  <input
                    type="url"
                    value={templateDraft.cta_url}
                    onChange={(event) => setTemplateDraft((draft) => ({ ...draft, cta_url: event.target.value }))}
                    placeholder="https://example.com"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={closeEditors}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save changes'}
                  </Button>
                </div>
              </form>
            )}

            {editingInsert && (
              <form onSubmit={handleInsertSubmit} className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Edit insert ({editingInsert.diagnosis_code} - Day {editingInsert.day} - {BRANCH_LABELS[editingInsert.branch] || editingInsert.branch})
                    </h3>
                    <p className="text-sm text-gray-500">Keep inserts concise (max ~25 words) and aligned with approved language.</p>
                  </div>
                  <Button type="button" variant="ghost" onClick={closeEditors}>
                    Close
                  </Button>
                </div>

                <textarea
                  value={insertDraft}
                  onChange={(event) => setInsertDraft(event.target.value)}
                  rows={6}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={closeEditors}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save changes'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
