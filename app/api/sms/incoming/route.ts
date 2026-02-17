import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { getServiceSupabase } from '@/lib/supabase';
import { processSmsOptOut } from '@/lib/sms/opt-out';
import { logEvent } from '@/lib/logging';

export const dynamic = 'force-dynamic';

const STOP_KEYWORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']);
const MIN_DAY = 1;
const MAX_DAY = 14;

function normalizePhoneNumber(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  if (phoneNumber.startsWith('+')) {
    return `+${digits}`;
  }
  return phoneNumber.trim();
}

function parseTwilioBody(rawBody: string): Record<string, string> {
  const params = new URLSearchParams(rawBody);
  const parsed: Record<string, string> = {};
  params.forEach((value, key) => {
    parsed[key] = value;
  });
  return parsed;
}

function getRequestUrl(req: NextRequest): string {
  const forwardedProto = req.headers.get('x-forwarded-proto');
  const forwardedHost = req.headers.get('x-forwarded-host');
  const host = forwardedHost || req.headers.get('host');
  const protocol = forwardedProto || 'https';

  if (!host) {
    return req.url;
  }

  return `${protocol}://${host}${req.nextUrl.pathname}`;
}

function buildTwiml(message: string) {
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(message);
  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}

function parsePainScore(message: string): number | null {
  const trimmed = message.trim();
  if (!/^\d{1,2}$/.test(trimmed)) {
    return null;
  }

  const score = Number(trimmed);
  if (!Number.isInteger(score) || score < 0 || score > 10) {
    return null;
  }

  return score;
}

function computeLegacyValue(
  painScore: number,
  initialPainScore: number | null
): 'better' | 'same' | 'worse' {
  if (typeof initialPainScore !== 'number') {
    return 'same';
  }

  if (painScore < initialPainScore) return 'better';
  if (painScore > initialPainScore) return 'worse';
  return 'same';
}

function clampDay(day: number): number {
  return Math.max(MIN_DAY, Math.min(MAX_DAY, day));
}

function deriveDayFromCreatedAt(createdAt: string | null): number {
  if (!createdAt) return 1;
  const createdTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdTime)) return 1;
  const diffDays = Math.floor((Date.now() - createdTime) / (1000 * 60 * 60 * 24)) + 1;
  return clampDay(diffDays);
}

async function resolveTargetDay(assessmentId: string, createdAt: string | null): Promise<number> {
  const supabase = getServiceSupabase();

  const { data: queueRows, error: queueError } = await supabase
    .from('check_in_queue')
    .select('day')
    .eq('assessment_id', assessmentId)
    .eq('channel', 'sms')
    .gte('day', MIN_DAY)
    .lte('day', MAX_DAY)
    .order('day', { ascending: true });

  if (queueError) {
    console.error('[sms/incoming] Failed to load queue days:', queueError);
  }

  const candidateDays =
    queueRows && queueRows.length > 0
      ? Array.from(
          new Set(
            queueRows
              .map((row) => Number(row.day))
              .filter((day) => Number.isInteger(day) && day >= MIN_DAY && day <= MAX_DAY)
          )
        ).sort((a, b) => a - b)
      : Array.from({ length: MAX_DAY }, (_, index) => index + 1);

  const { data: responseRows, error: responsesError } = await supabase
    .from('check_in_responses')
    .select('day')
    .eq('assessment_id', assessmentId)
    .gte('day', MIN_DAY)
    .lte('day', MAX_DAY);

  if (responsesError) {
    console.error('[sms/incoming] Failed to load response days:', responsesError);
  }

  const respondedDays = new Set(
    (responseRows || [])
      .map((row) => Number(row.day))
      .filter((day) => Number.isInteger(day) && day >= MIN_DAY && day <= MAX_DAY)
  );

  const firstMissingDay = candidateDays.find((day) => !respondedDays.has(day));
  if (firstMissingDay) {
    return firstMissingDay;
  }

  return deriveDayFromCreatedAt(createdAt);
}

async function computeSmsStreak(assessmentId: string): Promise<number> {
  const supabase = getServiceSupabase();

  const { data: rows, error } = await supabase
    .from('check_in_responses')
    .select('day')
    .eq('assessment_id', assessmentId)
    .eq('source', 'sms_reply')
    .not('pain_score', 'is', null)
    .gte('day', MIN_DAY)
    .lte('day', MAX_DAY)
    .order('day', { ascending: true });

  if (error) {
    console.error('[sms/incoming] Failed to compute streak:', error);
    return 0;
  }

  const days = new Set(
    (rows || [])
      .map((row) => Number(row.day))
      .filter((day) => Number.isInteger(day) && day >= MIN_DAY && day <= MAX_DAY)
  );

  let streak = 0;
  for (let day = MIN_DAY; day <= MAX_DAY; day += 1) {
    if (!days.has(day)) {
      break;
    }
    streak += 1;
  }

  return streak;
}

async function findAssessmentByPhone(phoneNumber: string) {
  const supabase = getServiceSupabase();
  const normalized = normalizePhoneNumber(phoneNumber);
  const raw = phoneNumber.trim();

  const selectColumns = 'id, created_at, initial_pain_score, phone_number';

  let result = await supabase
    .from('assessments')
    .select(selectColumns)
    .eq('phone_number', normalized)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }
  if (result.data) {
    return result.data;
  }

  if (raw && raw !== normalized) {
    result = await supabase
      .from('assessments')
      .select(selectColumns)
      .eq('phone_number', raw)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }
    if (result.data) {
      return result.data;
    }
  }

  const digits = normalized.replace(/\D/g, '');
  if (!digits) return null;

  const fallback = await supabase
    .from('assessments')
    .select(selectColumns)
    .like('phone_number', `%${digits.slice(-10)}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fallback.error) {
    throw fallback.error;
  }

  return fallback.data;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const payload = parseTwilioBody(rawBody);

    const signature = req.headers.get('x-twilio-signature') || '';
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) {
      return new NextResponse('Twilio auth token is not configured', { status: 500 });
    }

    const requestUrl = getRequestUrl(req);
    const signatureValid =
      twilio.validateRequest(authToken, signature, requestUrl, payload) ||
      twilio.validateRequest(authToken, signature, req.url, payload);

    if (!signatureValid) {
      return new NextResponse('Invalid signature', { status: 403 });
    }

    const from = payload.From || '';
    const body = (payload.Body || '').trim();
    const normalizedKeyword = body.toUpperCase().replace(/[^A-Z]/g, '');

    if (!from) {
      return buildTwiml('Unable to process your message. Please try again.');
    }

    if (STOP_KEYWORDS.has(normalizedKeyword)) {
      await processSmsOptOut(from, 'sms_stop_incoming');
      return buildTwiml(
        'You have been unsubscribed from PainOptix SMS messages. Reply START to resubscribe.'
      );
    }

    const painScore = parsePainScore(body);
    if (painScore === null) {
      return buildTwiml('Please reply with a number from 0 to 10. Reply STOP to opt out.');
    }

    const assessment = await findAssessmentByPhone(from);
    if (!assessment) {
      return buildTwiml(
        'We could not find an active tracker for this number. Please complete a new PainOptix assessment to begin.'
      );
    }

    const targetDay = await resolveTargetDay(assessment.id, assessment.created_at);
    const legacyValue = computeLegacyValue(painScore, assessment.initial_pain_score);

    const supabase = getServiceSupabase();
    const { error: upsertError } = await supabase
      .from('check_in_responses')
      .upsert(
        {
          assessment_id: assessment.id,
          day: targetDay,
          pain_score: painScore,
          source: 'sms_reply',
          value: legacyValue,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: 'assessment_id,day',
          ignoreDuplicates: false,
        }
      );

    if (upsertError) {
      console.error('[sms/incoming] Failed to save pain score:', upsertError);
      return buildTwiml('We hit a temporary issue saving your score. Please try again in a moment.');
    }

    await logEvent('sms_reply', {
      assessmentId: assessment.id,
      day: targetDay,
      painScore,
      source: 'sms_reply',
    });

    const streakCount = await computeSmsStreak(assessment.id);
    await logEvent('streak_count', {
      assessmentId: assessment.id,
      streak: streakCount,
      day: targetDay,
    });

    return buildTwiml(
      `Got it! Pain level: ${painScore}/10. We will check in again tomorrow. Reply STOP to opt out.`
    );
  } catch (error) {
    console.error('[sms/incoming] Webhook error:', error);
    return buildTwiml('We hit a temporary issue processing your message. Please try again shortly.');
  }
}
