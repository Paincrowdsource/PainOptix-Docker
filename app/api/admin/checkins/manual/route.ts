import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { resolveDiagnosisCode } from '@/lib/checkins/diagnosis'
import { renderCheckInEmailHTML } from '@/lib/checkins/preview'
import { isAdminRequest } from '@/lib/admin/auth'

const VALID_BRANCHES = new Set(['initial', 'better', 'same', 'worse'])
const VALID_DAYS = new Set([3, 7, 14])

type BranchOption = 'initial' | 'better' | 'same' | 'worse'

async function pickInsertText(
  diagnosisCode: string,
  day: number,
  branch: BranchOption,
): Promise<string> {
  const supabase = getServiceSupabase()
  const branchCandidates: BranchOption[] =
    branch === 'initial' ? ['initial', 'same'] : [branch]
  const diagnosisCandidates = [diagnosisCode, 'generic']

  for (const diagnosisCandidate of diagnosisCandidates) {
    for (const branchCandidate of branchCandidates) {
      const { data, error } = await supabase
        .from('diagnosis_inserts')
        .select('insert_text')
        .eq('diagnosis_code', diagnosisCandidate)
        .eq('day', day)
        .eq('branch', branchCandidate)
        .maybeSingle()

      if (error) {
        console.error('Insert lookup error', error)
        continue
      }

      if (data?.insert_text) {
        return data.insert_text
      }
    }
  }

  return ''
}

async function pickEncouragement(): Promise<string> {
  const supabase = getServiceSupabase()
  const { data, error } = await supabase
    .from('encouragements')
    .select('text')
    .limit(100)

  if (error) {
    console.error('Encouragement lookup error', error)
    return 'Keep going, you are making progress.'
  }

  if (!data || data.length === 0) {
    return 'Keep going, you are making progress.'
  }

  const randomIndex = Math.floor(Math.random() * data.length)
  return data[randomIndex]?.text || 'Keep going, you are making progress.'
}

function maskEmail(email: string | null | undefined): string {
  if (!email) {
    return 'assessment'
  }

  const [username, domain] = email.split('@')
  if (!domain) {
    return `${email.substring(0, 3)}***`
  }

  return `${username.substring(0, 2)}***@${domain}`
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: any
  try {
    payload = await request.json()
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const assessmentId = payload?.assessmentId as string | undefined
  const day = Number(payload?.day)
  const branch = payload?.branch as BranchOption
  const mode = payload?.mode as 'preview' | 'queue'

  if (!assessmentId || !VALID_DAYS.has(day) || !VALID_BRANCHES.has(branch) || !['preview', 'queue'].includes(mode)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  }

  const supabase = getServiceSupabase()

  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .select('id, email, guide_type, created_at')
    .eq('id', assessmentId)
    .maybeSingle()

  if (assessmentError) {
    console.error('Manual trigger assessment fetch error', assessmentError)
    return NextResponse.json({ error: 'Failed to load assessment' }, { status: 500 })
  }

  if (!assessment) {
    return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
  }

  const templateKey = `day${day}.${branch}`
  const { data: template, error: templateError } = await supabase
    .from('message_templates')
    .select('key, subject, shell_text, disclaimer_text, channel')
    .eq('key', templateKey)
    .maybeSingle()

  if (templateError) {
    console.error('Manual trigger template fetch error', templateError)
    return NextResponse.json({ error: 'Failed to load template' }, { status: 500 })
  }

  if (!template) {
    return NextResponse.json({ error: `Template not found for ${templateKey}` }, { status: 422 })
  }

  const diagnosisCode = resolveDiagnosisCode({ guide_type: assessment.guide_type }) || 'generic'
  const insertText = await pickInsertText(diagnosisCode, day, branch)
  const encouragementText = await pickEncouragement()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://painoptix.com'

  const html = renderCheckInEmailHTML({
    template,
    insertText,
    encouragementText,
    assessmentId,
    diagnosisCode,
    day: day as 3 | 7 | 14,
    branch,
    appUrl,
    assessmentCreatedAt: assessment.created_at,
    timezone: process.env.CHECKINS_DISPLAY_TZ || 'America/New_York',
  })

  if (mode === 'preview') {
    return NextResponse.json({ ok: true, html }, { status: 200 })
  }

  const { error: upsertError } = await supabase
    .from('check_in_queue')
    .upsert(
      {
        assessment_id: assessmentId,
        day,
        due_at: new Date().toISOString(),
        template_key: template.key,
        channel: template.channel || 'email',
        status: 'queued',
        sent_at: null,
        last_error: null,
      },
      { onConflict: 'assessment_id,day' },
    )

  if (upsertError) {
    console.error('Manual trigger queue upsert error', upsertError)
    return NextResponse.json({ error: 'Failed to queue check-in' }, { status: 500 })
  }

  return NextResponse.json(
    {
      ok: true,
      message: `Queued day ${day} (${branch}) for ${maskEmail(assessment.email)}`,
      html,
    },
    { status: 200 },
  )
}
