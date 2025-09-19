import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendEmail, sendSMS } from "@/lib/communications";

const MAX_ATTEMPTS_PER_HOUR = 3;
const CODE_TTL_MINUTES = 15;

type IdentifierType = "email" | "sms" | "phone" | "phone_number";

function normaliseIdentifierType(type: string): IdentifierType {
  if (type === "sms" || type === "phone") return "phone_number";
  return type === "email" ? "email" : "phone_number";
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function checkRateLimit(
  identifier: string,
  ip: string,
  action: string,
): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: contactLimits } = await supabaseAdmin
    .from("verification_rate_limits")
    .select("attempts")
    .eq("identifier", identifier)
    .eq("identifier_type", "contact")
    .eq("action", action)
    .gte("window_start", oneHourAgo);

  const { data: ipLimits } = await supabaseAdmin
    .from("verification_rate_limits")
    .select("attempts")
    .eq("identifier", ip)
    .eq("identifier_type", "ip")
    .eq("action", action)
    .gte("window_start", oneHourAgo);

  const contactAttempts =
    contactLimits?.reduce((sum, record) => sum + (record.attempts ?? 0), 0) ??
    0;
  const ipAttempts =
    ipLimits?.reduce((sum, record) => sum + (record.attempts ?? 0), 0) ?? 0;

  return (
    contactAttempts < MAX_ATTEMPTS_PER_HOUR &&
    ipAttempts < MAX_ATTEMPTS_PER_HOUR
  );
}

async function updateRateLimit(identifier: string, ip: string, action: string) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: existingContact } = await supabaseAdmin
    .from("verification_rate_limits")
    .select("id, attempts")
    .eq("identifier", identifier)
    .eq("identifier_type", "contact")
    .eq("action", action)
    .gte("window_start", oneHourAgo)
    .maybeSingle();

  if (existingContact) {
    await supabaseAdmin
      .from("verification_rate_limits")
      .update({ attempts: (existingContact.attempts ?? 0) + 1 })
      .eq("id", existingContact.id);
  } else {
    await supabaseAdmin.from("verification_rate_limits").insert({
      identifier,
      identifier_type: "contact",
      action,
      attempts: 1,
    });
  }

  const { data: existingIp } = await supabaseAdmin
    .from("verification_rate_limits")
    .select("id, attempts")
    .eq("identifier", ip)
    .eq("identifier_type", "ip")
    .eq("action", action)
    .gte("window_start", oneHourAgo)
    .maybeSingle();

  if (existingIp) {
    await supabaseAdmin
      .from("verification_rate_limits")
      .update({ attempts: (existingIp.attempts ?? 0) + 1 })
      .eq("id", existingIp.id);
  } else {
    await supabaseAdmin.from("verification_rate_limits").insert({
      identifier: ip,
      identifier_type: "ip",
      action,
      attempts: 1,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      identifier?: string;
      identifierType?: string;
    };
    const identifier = body.identifier?.trim();
    const identifierTypeRaw = body.identifierType?.trim();

    if (!identifier || !identifierTypeRaw) {
      return NextResponse.json(
        { error: "Identifier and type are required" },
        { status: 400 },
      );
    }

    const identifierType = normaliseIdentifierType(identifierTypeRaw);

    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const canProceed = await checkRateLimit(identifier, ip, "send_code");
    if (!canProceed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 },
      );
    }

    const { data: assessments, error: assessmentError } = await supabaseAdmin
      .from("assessments")
      .select("id")
      .eq(identifierType === "email" ? "email" : "phone_number", identifier)
      .limit(1);

    if (assessmentError || !assessments || assessments.length === 0) {
      return NextResponse.json(
        { error: "No assessments found for this contact information" },
        { status: 404 },
      );
    }

    await supabaseAdmin
      .from("verification_codes")
      .delete()
      .eq("identifier", identifier);

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

    const { error: insertError } = await supabaseAdmin
      .from("verification_codes")
      .insert({
        identifier,
        identifier_type: identifierType,
        code,
        ip_address: ip,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing verification code:", insertError);
      return NextResponse.json(
        { error: "Failed to generate verification code" },
        { status: 500 },
      );
    }

    if (identifierType === "email") {
      await sendEmail({
        to: identifier,
        subject: "Your PainOptix Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0B5394;">Your Verification Code</h2>
            <p>Use this code to access your PainOptix assessments:</p>
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0B5394;">${code}</span>
            </div>
            <p style="color: #666;">This code expires in 15 minutes.</p>
            <p style="color: #666;">If you didn't request this code, please ignore this email.</p>
          </div>
        `,
        text: `Your PainOptix verification code is: ${code}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this code, please ignore this email.`,
      });
    } else {
      await sendSMS({
        to: identifier,
        message: `Your PainOptix verification code is: ${code}\n\nThis code expires in 15 minutes.`,
      });
    }

    await updateRateLimit(identifier, ip, "send_code");

    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully",
    });
  } catch (error) {
    console.error("Error in send verification endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
