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
    const responseAssessmentIds = Array.from(new Set(responseData?.map(item => item.assessment_id) || []));
    let responseAssessmentsMap: Record<string, any> = {};

    if (responseAssessmentIds.length > 0) {
      const { data: responseAssessmentsData } = await supabase
        .from('v_assessments_visible')
        .select('id, email, diagnosis_code, guide_type')
        .in('id', responseAssessmentIds);

      responseAssessmentsMap = (responseAssessmentsData || []).reduce((acc, assessment) => {
        acc[assessment.id] = assessment;
        return acc;
      }, {} as Record<string, any>);
    }

    const enrichedResponseData = (responseData || []).map(item => ({
      ...item,
      assessment: responseAssessmentsMap[item.assessment_id] || null
    }));

    return NextResponse.json({ responses: enrichedResponseData }, { status: 200 });
  } catch (error) {
    console.error("Error fetching responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch responses" },
      { status: 500 }
    );
  }
}
