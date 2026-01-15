import "server-only"
import { NextRequest, NextResponse } from "next/server"
import { isAdminRequest } from "@/lib/admin/auth"
import { getServiceSupabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const isAdmin = await isAdminRequest(req)
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = getServiceSupabase()

    // Get total assessments (using view that excludes quarantined)
    const { count: totalAssessments, error: totalError } = await supabase
      .from('v_assessments_visible')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      console.error('[analytics] Error counting total assessments:', totalError)
    }

    // Get assessments from last 7 days
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { count: weeklyAssessments, error: weeklyError } = await supabase
      .from('v_assessments_visible')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString())

    if (weeklyError) {
      console.error('[analytics] Error counting weekly assessments:', weeklyError)
    }

    return NextResponse.json(
      {
        totalAssessments: totalAssessments || 0,
        weeklyAssessments: weeklyAssessments || 0,
        meta: {
          routeVersion: 'analytics-v1',
          timestamp: new Date().toISOString()
        }
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      }
    )
  } catch (error) {
    console.error("[analytics] Error fetching analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}
