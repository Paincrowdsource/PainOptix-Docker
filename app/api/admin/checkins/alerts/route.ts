import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { log } from "@/lib/logger";

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/checkins/alerts
 * Returns all red-flag alerts with associated assessment data
 */
export async function GET(req: NextRequest) {
  // Check admin auth
  const isAdmin = await isAdminRequest(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getServiceSupabase();

    // Get all red-flag alerts
    const { data: alerts, error: alertsError } = await supabase
      .from("alerts")
      .select("id, assessment_id, type, payload, created_at")
      .eq("type", "red_flag")
      .order("created_at", { ascending: false });

    if (alertsError) {
      throw alertsError;
    }

    // Get assessment IDs to fetch
    const assessmentIds = (alerts || [])
      .map((a) => a.assessment_id)
      .filter((id): id is string => id !== null);

    // Fetch assessment data separately (no FK relationship exists)
    let assessmentMap: Record<string, { research_id: string | null; email: string | null; phone_number: string | null; guide_type: string | null }> = {};

    if (assessmentIds.length > 0) {
      const { data: assessments, error: assessmentsError } = await supabase
        .from("assessments")
        .select("id, research_id, email, phone_number, guide_type")
        .in("id", assessmentIds);

      if (assessmentsError) {
        log("admin_alerts_assessments_error", { err: assessmentsError.message }, "warn");
        // Continue without assessment data rather than failing
      } else if (assessments) {
        assessmentMap = assessments.reduce((acc, a) => {
          acc[a.id] = {
            research_id: a.research_id,
            email: a.email,
            phone_number: a.phone_number,
            guide_type: a.guide_type,
          };
          return acc;
        }, {} as typeof assessmentMap);
      }
    }

    // Transform the data for frontend consumption
    const transformedAlerts = (alerts || []).map((alert: any) => {
      const assessment = alert.assessment_id ? assessmentMap[alert.assessment_id] : null;
      return {
        id: alert.id,
        assessment_id: alert.assessment_id,
        type: alert.type,
        payload: alert.payload,
        created_at: alert.created_at,
        // Flatten assessment data
        research_id: assessment?.research_id || null,
        email: assessment?.email || null,
        phone_number: assessment?.phone_number || null,
        guide_type: assessment?.guide_type || null,
      };
    });

    log("admin_alerts_fetched", { count: transformedAlerts.length });

    return NextResponse.json({
      alerts: transformedAlerts,
      count: transformedAlerts.length
    });
  } catch (error) {
    log("admin_alerts_error", { err: (error as Error).message }, "error");
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/checkins/alerts
 * Dismiss/acknowledge an alert
 * Body: { alertId: string }
 */
export async function DELETE(req: NextRequest) {
  // Check admin auth
  const isAdmin = await isAdminRequest(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { alertId } = body;

    if (!alertId) {
      return NextResponse.json(
        { error: "Missing alertId" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Delete the alert (acknowledge/dismiss)
    const { error } = await supabase
      .from("alerts")
      .delete()
      .eq("id", alertId);

    if (error) {
      throw error;
    }

    log("admin_alert_dismissed", { alertId });

    return NextResponse.json({ success: true });
  } catch (error) {
    log("admin_alert_dismiss_error", { err: (error as Error).message }, "error");
    return NextResponse.json(
      { error: "Failed to dismiss alert" },
      { status: 500 }
    );
  }
}
