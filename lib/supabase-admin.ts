import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Admin client with service role key - bypasses RLS
// WARNING: Only use server-side, never expose to client
let adminClient: SupabaseClient | null = null;

function getSupabaseAdmin() {
  if (!adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !key) {
      // During build time, these might not be available
      // Return a dummy client that will throw errors if actually used
      return {
        from: () => { throw new Error('Supabase not initialized during build') }
      } as any;
    }
    
    adminClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  
  return adminClient;
}

export const supabaseAdmin = getSupabaseAdmin()

// Helper function to safely read assessments
export async function getAssessmentById(id: string) {
  const { data, error } = await supabaseAdmin
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
  const { data, error } = await supabaseAdmin
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