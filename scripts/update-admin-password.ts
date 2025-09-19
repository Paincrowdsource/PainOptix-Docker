#!/usr/bin/env node
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: tsx scripts/update-admin-password.ts <email>");
    process.exit(1);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const newPass = process.env.NEW_ADMIN_PASSWORD;
  if (!url || !service) {
    console.error("Missing Supabase env (URL / SERVICE ROLE KEY).");
    process.exit(1);
  }
  if (!newPass) {
    console.error("Missing NEW_ADMIN_PASSWORD env.");
    process.exit(1);
  }
  const admin = createClient(url, service);
  const { data: users, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) { console.error("List users failed:", listErr.message); process.exit(1); }
  const user = users.users.find(u => (u.email || "").toLowerCase() === email.toLowerCase());
  if (!user) { console.error("User not found:", email); process.exit(1); }
  const { error: updErr } = await admin.auth.admin.updateUserById(user.id, { password: newPass });
  if (updErr) { console.error("Update failed:", updErr.message); process.exit(1); }
  console.log(` Updated password for ${email.replace(/(.).+(@.+)/,'$1***$2')}`);
}
main().catch(e => { console.error("Unexpected error:", e?.message || e); process.exit(1); });