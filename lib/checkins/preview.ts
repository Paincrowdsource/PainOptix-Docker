import { sign, type CheckInDay, type CheckInValue } from '@/lib/checkins/token'
import { resolveLogoFragment } from '@/lib/checkins/branding'

type BranchOption = 'initial' | 'better' | 'same' | 'worse'

type TemplateRecord = {
  key: string
  subject: string | null
  shell_text: string
  disclaimer_text: string
}

const BRAND = {
  name: 'PainOptix',
  accent: '#0B5394',
  accentDark: '#083A75',
  background: '#F6F8FB',
  card: '#FFFFFF',
  border: '#E2E8F5',
  text: '#1F2937',
  muted: '#6B7280',
}

const CTA_PALETTE: Record<CheckInValue, { background: string; border: string; color: string }> = {
  better: { background: '#0B5394', border: '#0B5394', color: '#FFFFFF' },
  same: { background: '#F3F4F6', border: '#CBD5E1', color: '#111827' },
  worse: { background: '#FEE2E2', border: '#FCA5A5', color: '#991B1B' },
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildParagraphs(raw: string, style: string): string {
  const trimmed = raw.trim()
  if (!trimmed) {
    return ''
  }

  return trimmed
    .split(/\r?\n\r?\n+/)
    .map((block) => {
      const safe = escapeHtml(block).replace(/\r?\n/g, '<br>')
      return `<p style="${style}">${safe}</p>`
    })
    .join('')
}


function buildInsertBlock(insert: string): string {
  const trimmed = insert.trim()
  if (!trimmed) {
    return ''
  }

  const body = buildParagraphs(
    trimmed,
    'margin:0;font-size:16px;line-height:1.6;color:#0B356F;',
  )

  return `<div style="margin:0 0 20px;border:1px solid ${BRAND.accent}1A;background:#EFF5FF;border-radius:12px;padding:18px;">${body}</div>`
}

function buildEncouragementBlock(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) {
    return ''
  }
  const safe = escapeHtml(trimmed).replace(/\r?\n/g, '<br>')
  return `<div style="margin:0 0 20px;padding:18px;border-radius:12px;background:#FFFFFF;border:1px dashed ${BRAND.accent}55;font-size:15px;line-height:1.6;color:${BRAND.accentDark};"><strong style="display:block;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:6px;">Encouragement</strong>${safe}</div>`
}

function renderShell(raw: string, insertBlock: string, encouragementBlock: string): string {
  const placeholderInsert = '__INSERT_BLOCK__'
  const placeholderEnc = '__ENCOURAGEMENT_BLOCK__'

  const normalized = raw
    .replace(/\{\{\s*insert\s*\}\}/gi, placeholderInsert)
    .replace(/\{\{\s*encouragement\s*\}\}/gi, placeholderEnc)
    .trim()

  const segments = normalized
    .split(new RegExp(`(${placeholderInsert}|${placeholderEnc})`, 'g'))
    .filter((segment) => segment.length > 0)

  const blocks: string[] = []

  segments.forEach((segment) => {
    if (segment === placeholderInsert) {
      if (insertBlock) {
        blocks.push(insertBlock)
      }
      return
    }

    if (segment === placeholderEnc) {
      if (encouragementBlock) {
        blocks.push(encouragementBlock)
      }
      return
    }

    const paragraphs = segment
      .split(/\r?\n\r?\n+/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0)

    paragraphs.forEach((paragraph) => {
      const safe = escapeHtml(paragraph).replace(/\r?\n/g, '<br>')
      blocks.push(
        `<p style="margin:0 0 18px;font-size:16px;line-height:1.65;color:${BRAND.text};">${safe}</p>`,
      )
    })
  })

  if (!/\{\{\s*insert\s*\}\}/i.test(raw) && insertBlock) {
    blocks.splice(Math.min(1, blocks.length), 0, insertBlock)
  }

  if (!/\{\{\s*encouragement\s*\}\}/i.test(raw) && encouragementBlock) {
    blocks.push(encouragementBlock)
  }

  return blocks.join('')
}

function buildMetaTable(meta: Record<string, string>): string {
  const rows = Object.entries(meta)
    .map(([label, value]) => {
      return `<tr>
  <td style="padding:6px 12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.muted};">${escapeHtml(label)}</td>
  <td style="padding:6px 12px;font-size:13px;color:${BRAND.text};">${escapeHtml(value)}</td>
</tr>`
    })
    .join('')

  return `<table role="presentation" width="100%" style="margin-top:24px;border-collapse:collapse;background:${BRAND.background};border-radius:12px;">${rows}</table>`
}

function buildCtaButtons(assessmentId: string, day: CheckInDay, appUrl: string) {
  const values: CheckInValue[] = ['better', 'same', 'worse']

  return values
    .map((value) => {
      const palette = CTA_PALETTE[value]
      const token = sign({ assessment_id: assessmentId, day, value })
      const url = `${appUrl}/c/i?token=${token}&source=checkin_d${day}`
      const label =
        value === 'better'
          ? 'Feeling Better'
          : value === 'same'
          ? 'About the Same'
          : 'Feeling Worse'

      return `<a href="${url}" style="display:inline-block;margin:0 12px 12px 0;padding:12px 20px;border-radius:999px;font-weight:600;font-size:15px;letter-spacing:0.02em;text-decoration:none;background:${palette.background};color:${palette.color};border:1px solid ${palette.border};">${label}</a>`
    })
    .join('')
}

export function renderCheckInEmailHTML(options: {
  template: TemplateRecord
  insertText: string
  encouragementText: string
  assessmentId: string
  diagnosisCode: string
  day: CheckInDay
  branch: BranchOption
  appUrl: string
  assessmentCreatedAt?: string
  timezone?: string
}): string {
  const {
    template,
    insertText,
    encouragementText,
    assessmentId,
    diagnosisCode,
    day,
    branch,
    appUrl,
    assessmentCreatedAt,
    timezone = 'America/New_York',
  } = options

  const insertBlock = buildInsertBlock(insertText)
  const encouragementBlock = buildEncouragementBlock(encouragementText)
  const bodyHtml = renderShell(template.shell_text || '', insertBlock, encouragementBlock)
  const disclaimerHtml = buildParagraphs(
    template.disclaimer_text || 'Reply STOP to opt out of future messages.',
    'margin:0;font-size:12px;line-height:1.6;color:' + BRAND.muted + ';',
  )
  const ctaHtml = buildCtaButtons(assessmentId, day, appUrl)
  const logoHtml = resolveLogoFragment(appUrl)

  let assessmentCreatedLabel = 'n/a'
  if (assessmentCreatedAt) {
    try {
      assessmentCreatedLabel = new Date(assessmentCreatedAt).toLocaleString('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      assessmentCreatedLabel = assessmentCreatedAt
    }
  }

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(template.subject || `Quick day ${day} check-in`)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:24px;background:${BRAND.background};font-family:'Segoe UI', Roboto, Arial, sans-serif;color:${BRAND.text};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;border-collapse:collapse;">
    <tr>
      <td style="padding:0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:${BRAND.card};border-radius:16px;box-shadow:0 16px 40px rgba(33, 56, 82, 0.08);border:1px solid ${BRAND.border};overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 28px 32px;">
              <div style="margin:0 0 20px 0;text-align:center;">${logoHtml}</div>
              <h1 style="margin:0 0 12px 0;font-size:26px;line-height:1.3;color:${BRAND.accent};">${escapeHtml(template.subject || `Quick day ${day} check-in`)}</h1>
              <p style="margin:0 0 24px 0;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};">Template ${escapeHtml(template.key)} | Branch ${escapeHtml(branch)} | Diagnosis ${escapeHtml(diagnosisCode)}</p>
              ${bodyHtml}
              <div style="margin:12px 0 24px 0;">${ctaHtml}</div>
              <div style="margin-top:28px;border-top:1px solid ${BRAND.border};padding-top:16px;">${disclaimerHtml}</div>
            </td>
          </tr>
        </table>
        ${buildMetaTable({
          'Assessment ID': assessmentId,
          'Check-in Day': `Day ${day}`,
          Branch: branch,
          Diagnosis: diagnosisCode,
          'Template Key': template.key,
          'Assessment Created': assessmentCreatedLabel,
        })}
      </td>
    </tr>
  </table>
</body>
</html>`
}
