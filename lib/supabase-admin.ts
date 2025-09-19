import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceSupabase } from "@/lib/supabase";

let cached: SupabaseClient | null = null;

function ensureSupabaseAdmin(): SupabaseClient {
  if (!cached) {
    cached = getServiceSupabase();
  }
  return cached;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = ensureSupabaseAdmin();
    const value = Reflect.get(
      client as unknown as Record<PropertyKey, unknown>,
      prop,
      receiver,
    );
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export function getSupabaseAdmin(): SupabaseClient {
  return ensureSupabaseAdmin();
}

export async function getAssessmentById(id: string) {
  const supabase = ensureSupabaseAdmin();
  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching assessment:", error);
    return null;
  }

  return data;
}

export async function getAssessmentsByEmail(email: string) {
  const supabase = ensureSupabaseAdmin();
  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching assessments:", error);
    return [];
  }

  return data;
}
