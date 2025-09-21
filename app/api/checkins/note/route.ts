import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { log } from "@/lib/logger";
import { verify, type CheckInDay } from "@/lib/checkins/token";

type AckBody = {
  token?: string;
  assessment_id?: string;
  day?: number | string;
  note?: string;
};

const NOTE_LIMIT = 280;
const ALLOWED_DAYS: CheckInDay[] = [3, 7, 14];
const RED_FLAG_KEYWORDS = [
  "bladder",
  "bowel",
  "saddle",
  "numbness",
  "fever",
  "trauma",
  "progressive weakness",
  "loss of control",
  "incontinence",
];

function parseDay(raw: AckBody["day"]): CheckInDay | undefined {
  if (raw === undefined || raw === null) return undefined;
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return undefined;
  return ALLOWED_DAYS.find((day) => day === numeric);
}

function scanRedFlags(text: string | undefined): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  return RED_FLAG_KEYWORDS.filter((term) => lower.includes(term));
}

export async function POST(req: NextRequest) {
  const supabase = getServiceSupabase();

  let body: AckBody | undefined;
  try {
    body = (await req.json()) as AckBody;
  } catch (error) {
    log("checkins_ack_invalid_json", { err: (error as Error).message }, "warn");
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const tokenPayload = body.token ? verify(body.token) : null;
  const assessmentId = body.assessment_id ?? tokenPayload?.assessment_id;
  const day = parseDay(body.day ?? tokenPayload?.day);
  const note = (body.note ?? "").toString().trim().slice(0, NOTE_LIMIT);

  if (!assessmentId || !day) {
    return NextResponse.json(
      { ok: false, error: "missing_required_fields" },
      { status: 400 },
    );
  }

  if (!note) {
    log("checkins_ack_empty_note", { assessmentId, day });
    return NextResponse.json({
      ok: true,
      red_flag: false,
      message: "No note provided.",
    });
  }

  const matchedTerms = scanRedFlags(note);
  const hasRedFlag = matchedTerms.length > 0;

  const { error: updateError } = await supabase
    .from("check_in_responses")
    .update({ note })
    .eq("assessment_id", assessmentId)
    .eq("day", day)
    .is("note", null);

  if (updateError) {
    log(
      "checkins_ack_note_update_failed",
      { assessmentId, day, err: updateError.message },
      "warn",
    );
  }

  if (hasRedFlag) {
    const { error: alertError } = await supabase.from("alerts").insert({
      assessment_id: assessmentId,
      type: "red_flag",
      payload: { day, matched: matchedTerms, note_excerpt: note.slice(0, 100) },
    });

    if (alertError) {
      log(
        "red_flag_alert_insert_error",
        { assessmentId, day, err: alertError.message },
        "warn",
      );
    }

    const webhookUrl = process.env.ALERT_WEBHOOK;
    if (webhookUrl) {
      const controller =
        typeof AbortController !== "undefined"
          ? new AbortController()
          : undefined;
      const timeout = controller
        ? setTimeout(() => controller.abort(), 2000)
        : undefined;
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assessment_id: assessmentId,
            matched_terms: matchedTerms,
            occurred_at: new Date().toISOString(),
          }),
          signal: controller?.signal,
        });
        log("red_flag_webhook_posted", { assessmentId, matchedTerms });
      } catch (error) {
        log(
          "red_flag_webhook_failed",
          { assessmentId, err: (error as Error).message },
          "warn",
        );
      } finally {
        if (timeout) clearTimeout(timeout);
      }
    }
  }

  const safetyMessage =
    "Thanks for your note. Some symptoms can signal serious conditions. Please seek in-person care if you have any concerns." +
    " This information is educational and not a diagnosis.";
  const okMessage = "Thanks for your note; it has been logged successfully.";

  log("checkins_ack", { assessmentId, day, hasRedFlag, len: note.length });

  return NextResponse.json({
    ok: true,
    red_flag: hasRedFlag,
    message: hasRedFlag ? safetyMessage : okMessage,
  });
}
