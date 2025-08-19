export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const events = JSON.parse(bodyText);

    const supabase = getServiceSupabase();

    for (const evt of events) {
      if (evt.event === 'open' || evt.event === 'click') {
        await supabase
          .from('communication_logs')
          .update({
            [evt.event === 'open' ? 'opened_at' : 'clicked_at']: new Date().toISOString()
          })
          .eq('message_id', evt.sg_message_id)
          .not('message_id', 'is', null);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('SendGrid webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}