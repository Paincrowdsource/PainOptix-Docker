import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { getValidDiagnosisCodes } from "@/lib/checkins/diagnosis";
import { log } from "@/lib/logger";

interface MissingInsert {
  diagnosis_code: string;
  day: number;
  branch: string;
}

export async function GET(req: NextRequest) {
  // Check admin auth
  const isAdmin = await isAdminRequest(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getServiceSupabase();

    // Define expected sets
    const diagnosisCodes = getValidDiagnosisCodes();
    const days = [3, 7, 14];
    const branches = ['same', 'better', 'worse'];
    const templateKeys = [
      'day3.same', 'day3.better', 'day3.worse', 'day3.initial',
      'day7.same', 'day7.better', 'day7.worse', 'day7.initial',
      'day14.same', 'day14.better', 'day14.worse', 'day14.initial'
    ];

    // Fetch existing diagnosis inserts
    const { data: existingInserts, error: insertsError } = await supabase
      .from('diagnosis_inserts')
      .select('diagnosis_code, day, branch');

    if (insertsError) {
      log("coverage_check_inserts_error", { error: insertsError.message }, "error");
      throw insertsError;
    }

    // Fetch existing templates
    const { data: existingTemplates, error: templatesError } = await supabase
      .from('message_templates')
      .select('key')
      .in('key', templateKeys);

    if (templatesError) {
      log("coverage_check_templates_error", { error: templatesError.message }, "error");
      throw templatesError;
    }

    // Build sets for quick lookup
    const existingInsertKeys = new Set(
      (existingInserts || []).map(i => `${i.diagnosis_code}:${i.day}:${i.branch}`)
    );
    const existingTemplateKeys = new Set(
      (existingTemplates || []).map(t => t.key)
    );

    // Find missing inserts
    const missingInserts: MissingInsert[] = [];
    for (const diagnosis of diagnosisCodes) {
      for (const day of days) {
        for (const branch of branches) {
          const key = `${diagnosis}:${day}:${branch}`;
          if (!existingInsertKeys.has(key)) {
            missingInserts.push({ diagnosis_code: diagnosis, day, branch });
          }
        }
      }
    }

    // Find missing templates
    const missingTemplates = templateKeys.filter(key => !existingTemplateKeys.has(key));

    log("coverage_check_complete", {
      totalExpectedInserts: diagnosisCodes.length * days.length * branches.length,
      existingInserts: existingInsertKeys.size,
      missingInserts: missingInserts.length,
      totalExpectedTemplates: templateKeys.length,
      existingTemplates: existingTemplateKeys.size,
      missingTemplates: missingTemplates.length
    });

    return NextResponse.json({
      missingInserts,
      missingTemplates
    }, { status: 200 });

  } catch (error) {
    log("coverage_check_error", { err: (error as Error).message }, "error");
    return NextResponse.json(
      { error: "Failed to check coverage" },
      { status: 500 }
    );
  }
}