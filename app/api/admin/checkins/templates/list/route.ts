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

    // Fetch message templates
    const { data: templates, error: templatesError } = await supabase
      .from('message_templates')
      .select('id, key, subject, shell_text, disclaimer_text, cta_url, channel, created_at')
      .order('key', { ascending: true });

    if (templatesError) {
      log("admin_templates_list_error", { error: templatesError.message }, "error");
      throw templatesError;
    }

    // Fetch diagnosis inserts
    const { data: inserts, error: insertsError } = await supabase
      .from('diagnosis_inserts')
      .select('id, diagnosis_code, day, branch, insert_text')
      .order('diagnosis_code', { ascending: true })
      .order('day', { ascending: true })
      .order('branch', { ascending: true });

    if (insertsError) {
      log("admin_inserts_list_error", { error: insertsError.message }, "error");
      throw insertsError;
    }

    log("admin_templates_list_success", {
      templatesCount: templates?.length || 0,
      insertsCount: inserts?.length || 0
    });

    return NextResponse.json({
      templates: templates || [],
      inserts: inserts || []
    }, { status: 200 });

  } catch (error) {
    log("admin_templates_list_error", { err: (error as Error).message }, "error");
    return NextResponse.json(
      { error: "Failed to load templates and inserts" },
      { status: 500 }
    );
  }
}