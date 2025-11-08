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

    const { data: responseData, error: responseError } = await supabase
      .from('v_check_in_responses_visible')
      .select('*')
      .order('created_at', { ascending: false });

    if (responseError) {
      throw responseError;
    }

    // Fetch assessments data separately for responses
    // Filter out null/undefined assessment_ids before querying
    const responseAssessmentIds = Array.from(
      new Set(
        responseData?.map(item => item.assessment_id).filter(Boolean) || []
      )
    );
    let responseAssessmentsMap: Record<string, any> = {};

    console.log('[checkins/responses] Response items:', responseData?.length || 0);
    console.log('[checkins/responses] Assessment IDs to fetch:', responseAssessmentIds.length);

    if (responseAssessmentIds.length > 0) {
      const { data: responseAssessmentsData, error: assessError } = await supabase
        .from('v_assessments_visible')
        .select('id, email, phone_number, diagnosis_code, guide_type')
        .in('id', responseAssessmentIds);

      if (assessError) {
        console.error('[checkins/responses] Error fetching assessments:', assessError);
      }

      console.log('[checkins/responses] Assessments fetched:', responseAssessmentsData?.length || 0);

      responseAssessmentsMap = (responseAssessmentsData || []).reduce((acc, assessment) => {
        acc[assessment.id] = assessment;
        return acc;
      }, {} as Record<string, any>);
    }

    const enrichedResponseData = (responseData || []).map(item => ({
      ...item,
      assessment: item.assessment_id ? (responseAssessmentsMap[item.assessment_id] || null) : null
    }));

    console.log('[checkins/responses] Enriched items:', enrichedResponseData.length);

    return NextResponse.json({ responses: enrichedResponseData }, { status: 200 });
  } catch (error) {
    console.error("Error fetching responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch responses" },
      { status: 500 }
    );
  }
}
