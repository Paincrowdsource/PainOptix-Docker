import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin/auth";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const isAdmin = await isAdminRequest(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getServiceSupabase();

    // Fetch queue items
    const { data: queueData, error: queueError } = await supabase
      .from('v_check_in_queue_visible')
      .select('*')
      .order('due_at', { ascending: true });

    if (queueError) {
      throw queueError;
    }

    // Fetch assessments data separately for queue items
    // Filter out null/undefined assessment_ids before querying
    const assessmentIds = Array.from(
      new Set(
        queueData?.map(item => item.assessment_id).filter(Boolean) || []
      )
    );
    let assessmentsMap: Record<string, any> = {};

    console.log('[checkins/queue] Queue items:', queueData?.length || 0);
    console.log('[checkins/queue] Assessment IDs to fetch:', assessmentIds.length);

    if (assessmentIds.length > 0) {
      const { data: assessmentsData, error: assessError } = await supabase
        .from('v_assessments_visible')
        .select('id, email, phone_number, diagnosis_code')
        .in('id', assessmentIds);

      if (assessError) {
        console.error('[checkins/queue] Error fetching assessments:', assessError);
      }

      console.log('[checkins/queue] Assessments fetched:', assessmentsData?.length || 0);

      assessmentsMap = (assessmentsData || []).reduce((acc, assessment) => {
        acc[assessment.id] = assessment;
        return acc;
      }, {} as Record<string, any>);
    }

    const enrichedQueueData = (queueData || []).map(item => ({
      ...item,
      assessment: item.assessment_id ? (assessmentsMap[item.assessment_id] || null) : null
    }));

    console.log('[checkins/queue] Enriched items:', enrichedQueueData.length);
    console.log('[checkins/queue] Sample item:', enrichedQueueData[0]);

    return NextResponse.json({ queueItems: enrichedQueueData }, { status: 200 });
  } catch (error) {
    console.error("Error fetching queue items:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue items" },
      { status: 500 }
    );
  }
}
