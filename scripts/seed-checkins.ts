// scripts/seed-checkins.ts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const FORBIDDEN = [/diagnose/i, /prescrib/i, /dosage/i, /\stake\s/i, /should do/i];

function safe(str: string) {
  return !FORBIDDEN.some(rx => rx.test(str));
}

const DISCLAIMER = 'Educational use only. Not a diagnosis or treatment. If symptoms worsen or new symptoms develop, seek medical care.';

const DAYS = [3, 7, 14] as const;
const BRANCHES = ['initial','better','same','worse'] as const;

const templateShell = (day: number, branch: typeof BRANCHES[number]) => ({
  key: `day${day}.${branch}`,
  subject: branch === 'initial' ? `Quick check-in (Day ${day})` : `Day ${day} update`,
  shell_text:
`{{insert}}

{{encouragement}}

Next step options below.`,
  disclaimer_text: DISCLAIMER,
  cta_url: null,
  channel: 'email' as const,
});

// Generic inserts removed - strict diagnosis-only behavior

const encouragements = [
  'Small steps compound—nice work showing up.',
  'Consistency beats intensity. You have got this.',
  'Two minutes is enough to keep momentum.',
  'Listen to your body and pace kindly.',
  'Progress is not linear—your effort matters.',
  'Focus on form and comfort first.',
  'Short walk + gentle mobility works well.',
  'Breath + movement can ease tension.',
  'Yesterday does not define today.',
  'Keep going—you are building capacity.',
];

async function upsertTemplates() {
  const rows = [];
  for (const d of DAYS) for (const b of BRANCHES) {
    const tpl = templateShell(d, b);
    if (!safe(tpl.shell_text) || !safe(tpl.disclaimer_text)) {
      console.warn(`Template rejected by lint: ${tpl.key}`);
      continue;
    }
    rows.push(tpl);
  }
  const { error } = await supabase.from('message_templates')
    .upsert(rows, { onConflict: 'key' });
  if (error) throw error;
  return rows.length;
}

async function upsertEncouragements() {
  const rows = encouragements.filter(safe).map(text => ({ text }));
  const { error } = await supabase.from('encouragements')
    .upsert(rows, { onConflict: 'text' });
  if (error) throw error;
  return rows.length;
}

// Generic inserts function removed - strict diagnosis-only behavior

(async () => {
  try {
    console.log('Seeding check-ins…');
    const t = await upsertTemplates();
    const e = await upsertEncouragements();
    // Generic inserts removed - strict diagnosis-only
    console.log(`OK: templates=${t} encouragements=${e}`);
    process.exit(0);
  } catch (err: any) {
    console.error('Seed failed:', err.message || err);
    process.exit(1);
  }
})();