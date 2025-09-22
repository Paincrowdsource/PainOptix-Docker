import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { isAdminRequest } from '@/lib/admin/auth'

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: any
  try {
    payload = await request.json()
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const type = payload?.type as 'template' | 'insert' | undefined
  const id = payload?.id as string | undefined
  const values = payload?.values as Record<string, unknown> | undefined

  if (!type || !id || !values) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  const supabase = getServiceSupabase()

  if (type === 'template') {
    const updatePayload = {
      subject: (values.subject ?? null) as string | null,
      shell_text: (values.shell_text ?? '').toString(),
      disclaimer_text: (values.disclaimer_text ?? '').toString(),
      cta_url: values.cta_url ? (values.cta_url as string) : null,
    }

    if (!updatePayload.shell_text.trim()) {
      return NextResponse.json({ error: 'Template body cannot be empty' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('message_templates')
      .update(updatePayload)
      .eq('id', id)
      .select('id, key, subject, shell_text, disclaimer_text, cta_url, channel, created_at')
      .maybeSingle()

    if (error) {
      console.error('Template update error', error)
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, template: data }, { status: 200 })
  }

  if (type === 'insert') {
    const insertText = (values.insert_text ?? '').toString()

    if (!insertText.trim()) {
      return NextResponse.json({ error: 'Insert text cannot be empty' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('diagnosis_inserts')
      .update({ insert_text: insertText })
      .eq('id', id)
      .select('*')
      .maybeSingle()

    if (error) {
      console.error('Insert update error', error)
      return NextResponse.json({ error: 'Failed to update insert' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Insert not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, insert: data }, { status: 200 })
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
}
