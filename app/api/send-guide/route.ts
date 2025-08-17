export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { deliverEducationalGuide } from '@/lib/guide-delivery';

export async function POST(request: NextRequest) {
  try {
    const { assessmentId, tier } = await request.json();

    if (!assessmentId || !tier) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Get assessment data
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (assessmentError || !assessment) {
      console.error('Assessment fetch error:', assessmentError);
      return NextResponse.json(
        { success: false, error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Update payment tier if it's free
    if (tier === 'free') {
      await supabase
        .from('assessments')
        .update({ payment_tier: 0 })
        .eq('id', assessmentId);
    }

    // Deliver the guide using existing delivery system
    await deliverEducationalGuide(assessmentId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Send guide error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send guide' },
      { status: 500 }
    );
  }
}