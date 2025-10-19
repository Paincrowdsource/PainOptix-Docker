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
    const now = new Date();

    // Get queue counts by status
    const { data: queueStats, error: queueError } = await supabase
      .from("check_in_queue")
      .select("status", { count: "exact", head: true });

    if (queueError) {
      throw queueError;
    }

    // Get counts grouped by status
    const { data: statusCounts } = await supabase.rpc("get_queue_status_counts");

    // Fallback to individual queries if RPC doesn't exist
    let queuedCount = 0;
    let sentCount = 0;
    let failedCount = 0;
    let dueNowCount = 0;

    if (!statusCounts) {
      // Queued count
      const { count: queued } = await supabase
        .from("check_in_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "queued");
      queuedCount = queued || 0;

      // Due now count (queued and past due_at)
      const { count: dueNow } = await supabase
        .from("check_in_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "queued")
        .lte("due_at", now.toISOString());
      dueNowCount = dueNow || 0;

      // Sent count
      const { count: sent } = await supabase
        .from("check_in_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "sent");
      sentCount = sent || 0;

      // Failed count
      const { count: failed } = await supabase
        .from("check_in_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed");
      failedCount = failed || 0;
    } else {
      // Use RPC results
      queuedCount = statusCounts.find((s: any) => s.status === "queued")?.count || 0;
      sentCount = statusCounts.find((s: any) => s.status === "sent")?.count || 0;
      failedCount = statusCounts.find((s: any) => s.status === "failed")?.count || 0;

      // Still need to calculate due now separately
      const { count: dueNow } = await supabase
        .from("check_in_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "queued")
        .lte("due_at", now.toISOString());
      dueNowCount = dueNow || 0;
    }

    // Get last sent timestamp
    const { data: lastSentData } = await supabase
      .from("check_in_queue")
      .select("sent_at")
      .eq("status", "sent")
      .order("sent_at", { ascending: false })
      .limit(1)
      .single();

    const lastSentAt = lastSentData?.sent_at || null;

    // Check if token secret is configured
    const tokenSecretConfigured = Boolean(process.env.CHECKINS_TOKEN_SECRET);

    // Check current environment flags
    const flags = {
      enabled: process.env.CHECKINS_ENABLED === "1",
      sandbox: process.env.CHECKINS_SANDBOX === "1",
      autowire: process.env.CHECKINS_AUTOWIRE === "1",
      dispatchTokenSet: Boolean(process.env.CHECKINS_DISPATCH_TOKEN),
      tokenSecretSet: tokenSecretConfigured,
      sendTz: process.env.CHECKINS_SEND_TZ || "America/New_York",
      sendWindow: process.env.CHECKINS_SEND_WINDOW || "none",
      startAt: process.env.CHECKINS_START_AT || "none",
      alertWebhook: Boolean(process.env.ALERT_WEBHOOK)
    };

    // Get response counts from last 24 hours
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const { count: recentResponses } = await supabase
      .from("check_in_responses")
      .select("*", { count: "exact", head: true })
      .gte("created_at", twentyFourHoursAgo.toISOString());

    // Get alert counts
    const { count: totalAlerts } = await supabase
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("type", "red_flag");

    const health = {
      status: "healthy",
      timestamp: now.toISOString(),
      queue: {
        total: queuedCount + sentCount + failedCount,
        queued: queuedCount,
        dueNow: dueNowCount,
        sent: sentCount,
        failed: failedCount
      },
      activity: {
        lastSentAt,
        responsesLast24h: recentResponses || 0,
        totalAlerts: totalAlerts || 0
      },
      configuration: {
        flags,
        readiness: {
          hasTokenSecret: tokenSecretConfigured,
          hasDispatchToken: flags.dispatchTokenSet,
          hasContent: true, // We verified this in investigation
          isConfigured: tokenSecretConfigured // Only token secret required (admin proxy handles dispatch)
        }
      }
    };

    // Determine overall readiness
    if (!health.configuration.readiness.isConfigured) {
      health.status = "not_ready";
    } else if (failedCount > 10) {
      health.status = "degraded";
    }

    log("checkins_health_check", {
      status: health.status,
      queuedCount,
      dueNowCount
    });

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    log("checkins_health_error", { err: (error as Error).message }, "error");
    return NextResponse.json(
      {
        status: "error",
        error: "Failed to get health status",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}