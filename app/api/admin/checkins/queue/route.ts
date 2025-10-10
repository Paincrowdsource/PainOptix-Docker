import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin/auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const isAdmin = await isAdminRequest(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getServiceSupabase();

    // Fetch queue items
    const { data: queueData, error: queueError } = await supabase
      .from('check_in_queue')
      .select('*')
      .order('due_at', { ascending: true });

    if (queueError) {
      throw queueError;
    }

    // Fetch assessments data separately for queue items
    const assessmentIds = Array.from(new Set(queueData?.map(item => item.assessment_id) || []));
    let assessmentsMap: Record<string, any> = {};

    if (assessmentIds.length > 0) {
      const { data: assessmentsData } = await supabase
        .from('assessments')
        .select('id, email, phone_number')
        .in('id', assessmentIds);

      assessmentsMap = (assessmentsData || []).reduce((acc, assessment) => {
        acc[assessment.id] = {
          email: assessment.email,
          phone_number: assessment.phone_number
        };
        return acc;
      }, {} as Record<string, any>);
    }

    const enrichedQueueData = (queueData || []).map(item => ({
      ...item,
      assessment: assessmentsMap[item.assessment_id] || null
    }));

    return NextResponse.json({ queueItems: enrichedQueueData }, { status: 200 });
  } catch (error) {
    console.error("Error fetching queue items:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue items" },
      { status: 500 }
    );
  }
}
