import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Admin client with service role key - bypasses RLS
// WARNING: Only use server-side, never expose to client
let adminClient: SupabaseClient | null = null;

// Lazy-init function - call this to get the admin client
export function supabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase env missing');
  }
  
  adminClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  return adminClient;
}

// Helper function to safely read assessments
export async function getAssessmentById(id: string) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching assessment:', error)
    return null
  }

  return data
}

// Helper to get assessments by email
export async function getAssessmentsByEmail(email: string) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching assessments:', error)
    return []
  }

  return data
}