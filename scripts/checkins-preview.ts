import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import minimist from 'minimist';

import { getServiceSupabase } from '@/lib/supabase';
import { resolveDiagnosisCode } from '@/lib/checkins/diagnosis';
import { resolveLogoFragment } from '@/lib/checkins/branding';
import { sign, type CheckInDay, type CheckInValue } from '@/lib/checkins/token';

type Template = {
  key: string;
  subject: string | null;
  shell_text: string;
  disclaimer_text: string;
  cta_url: string | null;
  channel: string;
};

type Insert = {
  diagnosis_code: string;
  day: number;
  branch: string;
  insert_text: string;
};

type Encouragement = { text: string };

const BRAND = {
  name: 'PainOptix',
  accent: '#0B5394',
  accentDark: '#083A75',
  background: '#F6F8FB',
  card: '#FFFFFF',
  border: '#E2E8F5',
  text: '#1F2937',
  muted: '#6B7280',
};

const CTA_PALETTE: Record<
  CheckInValue,
  { background: string; border: string; color: string }
> = {
  better: { background: '#0B5394', border: '#0B5394', color: '#FFFFFF' },
  same: { background: '#F3F4F6', border: '#CBD5E1', color: '#111827' },
  worse: { background: '#FEE2E2', border: '#FCA5A5', color: '#991B1B' },
};

const argv = minimist(process.argv.slice(2), {
  string: ['assessment', 'aid', 'a', 'branch', 'b', 'day', 'd', 'help', 'h'],
  alias: { assessment: ['aid', 'a'], day: ['d'], branch: ['b'], help: ['h'] },
});

function help(): void {
  console.log(`
Coaching Check-ins Preview

Usage:
  npm exec -- tsx scripts/checkins-preview.ts -- --assessment <uuid> --day <3|7|14> --branch <initial|better|same|worse>

Options:
  --assessment, -a, --aid   Assessment ID to preview
  --day, -d                 Day (3, 7, or 14)
  --branch, -b              initial | better | same | worse
  --help, -h                Show this help text
`);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildParagraphs(raw: string, style: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  return trimmed
    .split(/\r?\n\r?\n+/)
    .map((block) => {
      const safe = escapeHtml(block).replace(/\r?\n/g, '<br>');
      return `<p style="${style}">${safe}</p>`;
    })
    .join('');
}


function buildInsertBlock(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';

  const body = buildParagraphs(
    trimmed,
    'margin:0;font-size:16px;line-height:1.6;color:#0B356F;',
  );

  return `<div style="margin:0 0 20px;border:1px solid ${BRAND.accent}1A;background:#EFF5FF;border-radius:12px;padding:18px;">${body}</div>`;
}

function buildEncouragementBlock(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';

  const safe = escapeHtml(trimmed).replace(/\r?\n/g, '<br>');
  return `<div style="margin:0 0 20px;padding:20px;border-radius:14px;background:#F7FAFF;border:1px solid ${BRAND.accent}33;font-size:15px;line-height:1.6;color:${BRAND.accentDark};"><strong style="display:block;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:8px;color:${BRAND.accent};">Encouragement</strong>${safe}</div>`;
}

function renderShell(
  raw: string,
  insertBlock: string,
  encouragementBlock: string,
): string {
  const placeholderInsert = '__INSERT_BLOCK__';
  const placeholderEnc = '__ENCOURAGEMENT_BLOCK__';

  const normalized = raw
    .replace(/\{\{\s*insert\s*\}\}/gi, placeholderInsert)
    .replace(/\{\{\s*encouragement\s*\}\}/gi, placeholderEnc)
    .trim();

  const segments = normalized
    .split(new RegExp(`(${placeholderInsert}|${placeholderEnc})`, 'g'))
    .map((segment) => segment)
    .filter((segment) => segment.length > 0);

  const blocks: string[] = [];

  for (const segment of segments) {
    if (segment === placeholderInsert) {
      if (insertBlock) blocks.push(insertBlock);
      continue;
    }

    if (segment === placeholderEnc) {
      if (encouragementBlock) blocks.push(encouragementBlock);
      continue;
    }

    const paragraphs = segment
      .split(/\r?\n\r?\n+/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0);

    for (const paragraph of paragraphs) {
      const safe = escapeHtml(paragraph).replace(/\r?\n/g, '<br>');
      blocks.push(
        `<p style="margin:0 0 18px;font-size:16px;line-height:1.65;color:${BRAND.text};">${safe}</p>`,
      );
    }
  }

  if (!/\{\{\s*insert\s*\}\}/i.test(raw) && insertBlock) {
    blocks.splice(Math.min(1, blocks.length), 0, insertBlock);
  }

  if (!/\{\{\s*encouragement\s*\}\}/i.test(raw) && encouragementBlock) {
    blocks.push(encouragementBlock);
  }

  return blocks.join('');
}

function buildMetaTable(meta: Record<string, string>): string {
  const rows = Object.entries(meta)
    .map(([label, value]) => {
      return `<tr>
  <td style="padding:6px 12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.muted};">${escapeHtml(label)}</td>
  <td style="padding:6px 12px;font-size:13px;color:${BRAND.text};">${escapeHtml(value)}</td>
</tr>`;
    })
    .join('');

  return `<table role="presentation" width="100%" style="margin-top:24px;border-collapse:collapse;background:${BRAND.background};border-radius:12px;">${rows}</table>`;
}

function buildCtaButtons(
  assessmentId: string,
  day: CheckInDay,
  appUrl: string,
): string {
  const values: CheckInValue[] = ['better', 'same', 'worse'];

  return values
    .map((value) => {
      const palette = CTA_PALETTE[value];
      const token = sign(
        { assessment_id: assessmentId, day, value },
        24 * 60 * 60,
      );
      const url = `${appUrl}/c/i?token=${token}&source=checkin_d${day}`;
      const label =
        value === 'better'
          ? 'Feeling Better'
          : value === 'same'
            ? 'About the Same'
            : 'Feeling Worse';

      return `<a href="${url}" style="display:inline-block;margin:0 12px 12px 0;padding:12px 20px;border-radius:999px;font-weight:600;font-size:15px;letter-spacing:0.02em;text-decoration:none;background:${palette.background};color:${palette.color};border:1px solid ${palette.border};">${label}</a>`;
    })
    .join('');
}

function renderEmail(options: {
  subject: string;
  templateKey: string;
  diagnosisCode: string;
  branch: string;
  bodyHtml: string;
  ctaHtml: string;
  disclaimerHtml: string;
  logoHtml: string;
  meta: Record<string, string>;
}): string {
  const {
    subject,
    templateKey,
    diagnosisCode,
    branch,
    bodyHtml,
    ctaHtml,
    disclaimerHtml,
    logoHtml,
    meta,
  } = options;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(subject)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:24px;background:${BRAND.background};font-family:'Segoe UI', Roboto, Arial, sans-serif;color:${BRAND.text};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;border-collapse:collapse;">
    <tr>
      <td style="padding:0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:${BRAND.card};border-radius:16px;box-shadow:0 16px 40px rgba(33, 56, 82, 0.08);border:1px solid ${BRAND.border};overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 28px 32px;">
              <div style="margin:0 0 14px 0;text-align:center;">${logoHtml}</div>
              <h1 style="margin:0 0 26px 0;font-size:28px;line-height:1.28;color:${BRAND.accent};">${escapeHtml(subject)}</h1>
              ${bodyHtml}
              <div style="margin:12px 0 24px 0;">${ctaHtml}</div>
              <div style="margin-top:28px;border-top:1px solid ${BRAND.border};padding-top:16px;">${disclaimerHtml}</div>
            </td>
          </tr>
        </table>
        ${buildMetaTable(meta)}
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function main(): Promise<void> {
  if (argv.help || argv.h) {
    help();
    process.exit(0);
  }

  const assessmentId = (argv.assessment ?? argv.aid ?? argv.a) as string | undefined;
  const dayRaw = (argv.day ?? argv.d) as string | number | undefined;
  const branch = (argv.branch ?? argv.b ?? 'initial') as
    | 'initial'
    | 'better'
    | 'same'
    | 'worse';

  const dayValue =
    typeof dayRaw === 'string'
      ? Number.parseInt(dayRaw, 10)
      : typeof dayRaw === 'number'
        ? dayRaw
        : NaN;

  if (!assessmentId || !Number.isFinite(dayValue) || ![3, 7, 14].includes(Number(dayValue))) {
    console.error('Error: --assessment and --day (3|7|14) are required.');
    help();
    process.exit(1);
  }

  const day = Number(dayValue) as CheckInDay;

  if (!process.env.CHECKINS_TOKEN_SECRET) {
    console.error('Error: CHECKINS_TOKEN_SECRET env must be set for token signing.');
    process.exit(1);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://painoptix.com';

  const supabase = getServiceSupabase();

  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .select('id, guide_type, created_at')
    .eq('id', assessmentId)
    .maybeSingle();

  if (assessmentError || !assessment) {
    console.error('Error: assessment not found or database error.', assessmentError);
    process.exit(1);
  }

  const diagnosisCode = resolveDiagnosisCode({ guide_type: assessment.guide_type }) || 'generic';

  const templateKey = `day${day}.${branch}`;
  const { data: templateRows, error: templateError } = await supabase
    .from('message_templates')
    .select('key,subject,shell_text,disclaimer_text,cta_url,channel')
    .eq('key', templateKey)
    .limit(1);

  if (templateError || !templateRows || templateRows.length === 0) {
    console.error(`Error: message_template ${templateKey} missing.`);
    process.exit(1);
  }

  const template = templateRows[0] as Template;

  const branchSequence =
    branch === 'initial' ? ['initial', 'same'] : [branch];
  const diagnosisSequence = [diagnosisCode, 'generic'];

  let insertText = '';

  for (const diagnosisCandidate of diagnosisSequence) {
    if (insertText) {
      break;
    }

    for (const branchCandidate of branchSequence) {
      const { data: insertRows, error: insertError } = await supabase
        .from('diagnosis_inserts')
        .select('diagnosis_code,day,branch,insert_text')
        .eq('diagnosis_code', diagnosisCandidate)
        .eq('day', day)
        .eq('branch', branchCandidate)
        .limit(1);

      if (insertError) {
        console.error('Error: failed to load insert.', {
          diagnosisCandidate,
          branchCandidate,
          error: insertError,
        });
        process.exit(1);
      }

      if (insertRows && insertRows.length > 0) {
        insertText = (insertRows[0] as Insert).insert_text;
        break;
      }
    }
  }

  const { data: encouragementRows, error: encouragementError } = await supabase
    .from('encouragements')
    .select('text')
    .limit(100);

  if (encouragementError) {
    console.error('Error: failed to load encouragements.', encouragementError);
    process.exit(1);
  }

  const encouragement =
    encouragementRows && encouragementRows.length
      ? (encouragementRows[
          Math.floor(Math.random() * encouragementRows.length)
        ] as Encouragement).text
      : 'Keep going, you are making progress.';

  const insertBlock = buildInsertBlock(insertText);
  const encouragementBlock = buildEncouragementBlock(encouragement);
  const bodyHtml = renderShell(template.shell_text || '', insertBlock, encouragementBlock);

  const disclaimerHtml = buildParagraphs(
    template.disclaimer_text || 'Reply STOP to opt out of future messages.',
    'margin:0;font-size:12px;line-height:1.6;color:' + BRAND.muted + ';',
  );

  const ctaHtml = buildCtaButtons(assessment.id, day, appUrl);
  const logoHtml = resolveLogoFragment(appUrl);

  const timezone = process.env.CHECKINS_DISPLAY_TZ || 'America/New_York';
  const createdAt = assessment.created_at
    ? new Date(assessment.created_at).toLocaleString('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'n/a';

  const html = renderEmail({
    subject: template.subject || `Quick day ${day} check-in`,
    templateKey,
    diagnosisCode,
    branch,
    bodyHtml,
    ctaHtml,
    disclaimerHtml,
    logoHtml,
    meta: {
      'Assessment ID': assessment.id,
      'Check-in Day': `Day ${day}`,
      Branch: branch,
      Diagnosis: diagnosisCode,
      'Template Key': templateKey,
      'Assessment Created': createdAt,
    },
  });

  const outDir = path.resolve('tmp', 'checkins-previews');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, `preview-day${day}-${branch}.html`);
  fs.writeFileSync(outPath, html, 'utf8');
  console.log('PREVIEW:', outPath);
}

main().catch((error) => {
  console.error('Preview generation failed:', error);
  process.exit(1);
});











