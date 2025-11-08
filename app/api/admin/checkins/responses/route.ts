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

    const enrichedResponseData = (responseData || []).map(item => {
      const assessment = item.assessment_id ? (responseAssessmentsMap[item.assessment_id] || null) : null;
      return {
        ...item,
        assessment,
        // Flat contact fields for UI flexibility
        contact_email: assessment?.email ?? null,
        contact_phone: assessment?.phone_number ?? null,
        contact: assessment?.email ?? assessment?.phone_number ?? null
      };
    });

    console.log('[checkins/responses] Enriched items:', enrichedResponseData.length);
    console.log('[checkins/responses] Sample item:', enrichedResponseData[0]);

    return NextResponse.json(
      {
        responses: enrichedResponseData,
        meta: {
          routeVersion: 'checkins-responses-v3',
          timestamp: new Date().toISOString(),
          counts: {
            total: enrichedResponseData.length,
            withAssessment: enrichedResponseData.filter(i => i.assessment).length
          }
        }
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-PO-Route-Version': 'checkins-responses-v3'
        }
      }
    );
  } catch (error) {
    console.error("Error fetching responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch responses" },
      { status: 500 }
    );
  }
}
