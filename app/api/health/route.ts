import { NextResponse } from "next/server";

const flag = (k: string) =>
  Boolean(process.env[k] && String(process.env[k]).length > 0);

export async function GET() {
  const checks = {
    supabase: {
      url: flag("NEXT_PUBLIC_SUPABASE_URL"),
      anonKey: flag("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      serviceKey: flag("SUPABASE_SERVICE_ROLE_KEY"),
    },
    sendgrid: {
      apiKey: flag("SENDGRID_API_KEY"),
      from: flag("EMAIL_FROM"),
    },
  };

  return NextResponse.json({ ok: true, checks }, { status: 200 });
}
