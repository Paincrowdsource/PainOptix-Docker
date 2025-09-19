#!/usr/bin/env node
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import minimist from "minimist";
import { getServiceSupabase } from "@/lib/supabase";

// These imports must exist in your repo per earlier logs:
import { resolveDiagnosisCode } from "@/lib/checkins/diagnosis";
import { sign, type CheckInDay, type CheckInValue } from "@/lib/checkins/token";

type Template = {
  key: string;
  subject: string | null;
  shell_text: string;
  disclaimer_text: string;
  cta_url: string | null;
  channel: string;
};
type Insert = {
  diagnosis_code: string;
  day: number;
  branch: string;
  insert_text: string;
};
type Encouragement = { text: string };

const argv = minimist(process.argv.slice(2), {
  string: ["assessment", "aid", "a", "branch", "b", "day", "d", "help", "h"],
  alias: { assessment: ["aid", "a"], day: ["d"], branch: ["b"], help: ["h"] },
});

function help() {
  console.log(`
Check-ins Email Preview Generator

Usage:
  npm exec -- tsx scripts/checkins-preview.ts -- --assessment <uuid> --day <3|7|14> --branch <initial|better|same|worse>

Options:
  --assessment, -a, --aid   Assessment ID to preview
  --day, -d                 Day (3, 7, or 14)
  --branch, -b              initial | better | same | worse
  --help, -h                Show help
`);
}

async function main() {
  if (argv.help || argv.h) {
    help();
    process.exit(0);
  }

  const assessmentId = (argv.assessment || argv.aid || argv.a) as
    | string
    | undefined;
  const dayRaw = (argv.day || argv.d) as string | number | undefined;
  const branchArg = (argv.branch || argv.b || "initial") as
    | "initial"
    | "better"
    | "same"
    | "worse";

  const dayNum =
    typeof dayRaw === "string"
      ? parseInt(dayRaw, 10)
      : typeof dayRaw === "number"
        ? dayRaw
        : NaN;
  if (
    !assessmentId ||
    !Number.isFinite(dayNum) ||
    ![3, 7, 14].includes(Number(dayNum))
  ) {
    console.error("Error: --assessment and --day (3|7|14) are required.");
    help();
    process.exit(1);
  }
  const day = Number(dayNum) as CheckInDay;
  const branch = branchArg;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://painoptix.com";
  const tokenSecret = process.env.CHECKINS_TOKEN_SECRET;
  if (!tokenSecret) {
    console.error(
      "Error: CHECKINS_TOKEN_SECRET env is required for preview token signing.",
    );
    process.exit(1);
  }

  const supabase = getServiceSupabase();

  // 1) Load assessment -> derive diagnosis_code
  const { data: assessment, error: aErr } = await supabase
    .from("assessments")
    .select("id, guide_type, created_at")
    .eq("id", assessmentId)
    .maybeSingle();

  if (aErr || !assessment) {
    console.error("Error: assessment not found or DB error.", aErr);
    process.exit(1);
  }

  // Your repo provides this mapper already.
  const diagnosisCode =
    resolveDiagnosisCode(assessment.guide_type) || "generic";

  // 2) Load template (deterministic key: dayN.branch)
  const templateKey = `day${day}.${branch}`;
  const { data: templates, error: tErr } = await supabase
    .from("message_templates")
    .select("key,subject,shell_text,disclaimer_text,cta_url,channel")
    .eq("key", templateKey)
    .limit(1);

  if (tErr || !templates || templates.length === 0) {
    console.error(`Error: message_template ${templateKey} missing`);
    process.exit(1);
  }
  const tpl = templates[0] as Template;

  // 3) Load insert (specific -> generic fallback)
  let insertText = "";
  {
    const { data: insSpecific } = await supabase
      .from("diagnosis_inserts")
      .select("diagnosis_code,day,branch,insert_text")
      .eq("diagnosis_code", diagnosisCode)
      .eq("day", day)
      .eq("branch", branch)
      .limit(1);
    if (insSpecific && insSpecific.length) {
      insertText = (insSpecific[0] as Insert).insert_text;
    } else {
      const { data: insGeneric } = await supabase
        .from("diagnosis_inserts")
        .select("diagnosis_code,day,branch,insert_text")
        .eq("diagnosis_code", "generic")
        .eq("day", day)
        .eq("branch", branch)
        .limit(1);
      insertText =
        insGeneric && insGeneric.length
          ? (insGeneric[0] as Insert).insert_text
          : "(missing insert)";
    }
  }

  // 4) Pick an encouragement (client-side random)
  const { data: encourList } = await supabase
    .from("encouragements")
    .select("text")
    .limit(100);
  const encouragement =
    encourList && encourList.length
      ? (
          encourList[
            Math.floor(Math.random() * encourList.length)
          ] as Encouragement
        ).text
      : "Keep going, you are making progress.";

  // 5) Render body from shell with placeholders
  const body =
    tpl.shell_text
      .replace("{{insert}}", insertText)
      .replace("{{encouragement}}", encouragement) +
    "\n\n" +
    (tpl.disclaimer_text || "");

  // 6) Build one-tap links (Better/Same/Worse) with signed tokens and source=checkin_d{day}
  const values: CheckInValue[] = ["better", "same", "worse"];
  const links = values
    .map((value) => {
      const token = sign(
        {
          assessment_id: assessmentId,
          day,
          value,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        },
        tokenSecret,
      );
      const url = `${appUrl}/c/i?token=${token}&source=checkin_d${day}`;
      const label = value[0].toUpperCase() + value.slice(1);
      const cls =
        value === "better"
          ? "btn"
          : value === "same"
            ? "btn neutral"
            : "btn danger";
      return `<a href="${url}" class="${cls}">${label}</a>`;
    })
    .join(" ");

  // 7) Simple HTML preview
  const html = `<!doctype html>
<html><head><meta charset="utf-8">
  <title>${tpl.subject ?? "Check-in"}</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height:1.4; margin:24px; }
    .btn{ padding:10px 14px; border-radius:8px; text-decoration:none; display:inline-block; margin-right:8px; border:1px solid #ddd; }
    .neutral{ background:#f2f2f2; }
    .danger{ background:#ffe8e8; border-color:#ffcccc;}
    .meta{ color:#666; font-size:12px; margin-top:12px; }
    pre{ background:#fafafa; padding:12px; border:1px solid #eee; border-radius:8px; overflow:auto;}
  </style>
</head>
<body>
  <h2>${tpl.subject ?? `Day ${day} check-in`}</h2>
  <div class="meta">template: <code>${templateKey}</code>  diagnosis: <code>${diagnosisCode}</code></div>
  <pre>${body.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>
  <p>${links}</p>
</body></html>`;

  // 8) Write file
  const outDir = path.resolve("tmp");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `preview-day${day}-${branch}.html`);
  fs.writeFileSync(outPath, html, "utf8");
  console.log("PREVIEW:", outPath);
}

main().catch((e) => {
  console.error("Preview generation failed:", e);
  process.exit(1);
});
