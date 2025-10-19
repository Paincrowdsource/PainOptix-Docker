import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin/auth";
import { log } from "@/lib/logger";

export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  // Check admin auth
  const isAdmin = await isAdminRequest(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhookUrl = process.env.ALERT_WEBHOOK;

  if (!webhookUrl) {
    log("red_flag_test_no_webhook", {}, "info");
    return NextResponse.json(
      { ok: false, error: "ALERT_WEBHOOK not configured" },
      { status: 500 }
    );
  }

  try {
    // Prepare test payload
    const payload = {
      type: "red_flag_test",
      occurred_at: new Date().toISOString()
    };

    log("red_flag_test_sending", { webhookUrl: webhookUrl.substring(0, 20) + "..." });

    // Send test webhook with 2s timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (response.ok) {
      log("red_flag_test_success", { status: response.status });
      return NextResponse.json({ ok: true }, { status: 200 });
    } else {
      const error = `Webhook returned ${response.status}`;
      log("red_flag_test_failed", { error, status: response.status }, "error");
      return NextResponse.json({ ok: false, error }, { status: 500 });
    }
  } catch (error: any) {
    const errorMessage = error.name === "AbortError" ? "Request timeout (2s)" : error.message;
    log("red_flag_test_error", { error: errorMessage }, "error");
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}