import { createClient } from '@supabase/supabase-js'

// Admin client with service role key - bypasses RLS
// WARNING: Only use server-side, never expose to client
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

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