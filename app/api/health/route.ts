import { NextResponse } from "next/server";

function flag(k: string) {
  return Boolean(process.env[k] && String(process.env[k]).length > 0);
}

export async function GET() {
  // Only environment presence checks. Do NOT create clients or call networks here.
  const sendgridFlags = { emailFrom: flag("EMAIL_FROM"), sendgridFrom: flag("SENDGRID_FROM_EMAIL") };
  console.log("[health] sendgrid flags", JSON.stringify(sendgridFlags));

  const checks = {
    supabase: {
      url: flag("NEXT_PUBLIC_SUPABASE_URL") || flag("SUPABASE_URL"),
      anonKey: flag("NEXT_PUBLIC_SUPABASE_ANON_KEY") || flag("SUPABASE_ANON_KEY"),
      serviceKey: flag("SUPABASE_SERVICE_ROLE_KEY"),
    },
    sendgrid: {
      apiKey: flag("SENDGRID_API_KEY"),
      from: flag("EMAIL_FROM") || flag("SENDGRID_FROM_EMAIL"),
    },
    stripe: {
      secret: flag("STRIPE_SECRET_KEY"),
    },
    app: {
      nodeEnv: flag("NODE_ENV"),
      buildId: process.env.NEXT_BUILD_ID || null,
    },
  };

  const ok = true; // never block DO readiness; surface detail in JSON instead
  return NextResponse.json({ ok, checks }, { status: 200 });
}



