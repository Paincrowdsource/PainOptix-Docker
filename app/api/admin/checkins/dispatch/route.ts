import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin/auth";
import { dispatchDue } from "@/lib/checkins/dispatch";
import { log } from "@/lib/logger";

export async function POST(req: NextRequest) {
  // Check admin auth using existing helper
  const isAdmin = await isAdminRequest(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse request body for optional parameters
    let limit = 100;
    let dryRun = false;

    try {
      const body = await req.json();
      if (typeof body?.limit === "number" && Number.isFinite(body.limit)) {
        const normalized = Math.floor(body.limit);
        if (normalized > 0) {
          limit = Math.min(normalized, 1000);
        }
      }
      if (typeof body?.dryRun === "boolean") {
        dryRun = body.dryRun;
      }
    } catch {
      // Body is optional, ignore parse errors
    }

    log("admin_dispatch_start", { limit, dryRun });

    // Call the dispatch function directly (bypasses token requirement)
    const result = await dispatchDue(limit, { dryRun });

    log("admin_dispatch_complete", {
      limit,
      dryRun,
      sent: result.sent || 0,
      failed: result.failed || 0,
      skipped: result.skipped || 0
    });

    return NextResponse.json({
      ok: true,
      result
    }, { status: 200 });
  } catch (error) {
    log("admin_dispatch_error", { err: (error as Error).message }, "error");
    return NextResponse.json(
      { ok: false, error: "Dispatch failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Support GET for convenience (dry-run only)
  const isAdmin = await isAdminRequest(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    log("admin_dispatch_dry_run", { via: "GET" });
    const result = await dispatchDue(100, { dryRun: true });
    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (error) {
    log("admin_dispatch_error", { err: (error as Error).message }, "error");
    return NextResponse.json(
      { ok: false, error: "Dispatch failed" },
      { status: 500 }
    );
  }
}