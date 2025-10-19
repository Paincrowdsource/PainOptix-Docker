import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { log } from "@/lib/logger";

export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  // Check admin auth
  const isAdmin = await isAdminRequest(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getServiceSupabase();

    // Fetch recent assessments for manual trigger
    const { data: assessments, error: assessmentsError } = await supabase
      .from('assessments')
      .select('id, email, guide_type, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (assessmentsError) {
      log("admin_assessments_list_error", { error: assessmentsError.message }, "error");
      throw assessmentsError;
    }

    log("admin_assessments_list_success", {
      assessmentsCount: assessments?.length || 0
    });

    return NextResponse.json({
      assessments: assessments || []
    }, { status: 200 });

  } catch (error) {
    log("admin_assessments_list_error", { err: (error as Error).message }, "error");
    return NextResponse.json(
      { error: "Failed to load assessments" },
      { status: 500 }
    );
  }
}