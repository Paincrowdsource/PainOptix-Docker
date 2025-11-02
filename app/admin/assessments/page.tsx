import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdminAuth } from '@/lib/auth/server-admin'
import { getServiceSupabase } from '@/lib/supabase'
import AssessmentsClient from './AssessmentsClient'

/**
 * Admin Assessments - Server Component
 *
 * Fetches all assessments server-side with no caching.
 * Passes data to client component for rendering and interactivity.
 */
export default async function AssessmentsPage() {
  // Prevent caching - always fetch fresh data
  noStore()

  // Check authentication
  const isAuthenticated = await requireAdminAuth()

  if (!isAuthenticated) {
    redirect('/admin/login')
  }

  // Fetch assessments data server-side
  const assessments = await fetchAssessments()

  return <AssessmentsClient assessments={assessments} />
}

/**
 * Fetch assessments from Supabase
 * Uses service role for full access
 */
async function fetchAssessments() {
  const supabaseService = getServiceSupabase()

  try {
    const { data, error } = await supabaseService
      .from('assessments')
      .select(`
        *,
        guide_deliveries (*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching assessments:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching assessments:', error)
    return []
  }
}
