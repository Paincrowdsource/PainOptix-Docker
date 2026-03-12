import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client to bypass RLS
    const supabaseService = getServiceSupabase();

    // Step 1: Fetch assessments
    const { data: assessments, error } = await supabaseService
      .from('v_assessments_visible')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assessments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Step 2: Fetch guide deliveries for these assessments
    const assessmentIds = assessments?.map(a => a.id) || []
    let guideDeliveriesMap: Record<string, any[]> = {}

    if (assessmentIds.length > 0) {
      const { data: guideDeliveries } = await supabaseService
        .from('v_guide_deliveries_visible')
        .select('*')
        .in('assessment_id', assessmentIds)

      // Group by assessment_id
      guideDeliveriesMap = (guideDeliveries || []).reduce((acc, delivery) => {
        if (!acc[delivery.assessment_id]) {
          acc[delivery.assessment_id] = []
        }
        acc[delivery.assessment_id].push(delivery)
        return acc
      }, {} as Record<string, any[]>)
    }

    // Step 3: Enrich assessments with guide_deliveries
    const enrichedAssessments = (assessments || []).map(assessment => ({
      ...assessment,
      guide_deliveries: guideDeliveriesMap[assessment.id] || []
    }))

    return NextResponse.json(
      {
        assessments: enrichedAssessments,
        meta: {
          routeVersion: 'assessments-v2',
          ts: new Date().toISOString()
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'X-PO-Route-Version': 'assessments-v2'
        }
      }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}