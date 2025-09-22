import { NextRequest, NextResponse } from 'next/server';

function getTokenFrom(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  const fallback = req.headers.get('x-dispatch-token');
  return fallback ? fallback.trim() : null;
}

export async function POST(req: NextRequest) {
  const configured = (process.env.CHECKINS_DISPATCH_TOKEN || '').trim();
  const provided = (getTokenFrom(req) || '').trim();

  if (!configured || configured !== provided) {
    return NextResponse.json(
      { ok: true, skipped: true, reason: 'missing-or-invalid-token' },
      { status: 200 },
    );
  }

  try {
    const url = new URL(req.url);
    const dryRun = url.searchParams.get('dryRun') === '1';

    let limit = 100;
    try {
      const body = await req.json();
      if (typeof body?.limit === 'number' && Number.isFinite(body.limit)) {
        const normalized = Math.floor(body.limit);
        if (normalized > 0) {
          limit = Math.min(normalized, 1000);
        }
      }
    } catch {
      // Body optional; ignore parse errors
    }

    const { dispatchDue } = await import('@/lib/checkins/dispatch');

    const result = await dispatchDue(limit, { dryRun });
    return NextResponse.json({ ok: true, skipped: false, result }, { status: 200 });
  } catch (error) {
    console.error('[Dispatch] Error running dispatcher', error);
    return NextResponse.json(
      { ok: false, skipped: false, reason: 'dispatch-failed' },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
