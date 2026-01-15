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
    const { searchParams } = new URL(req.url)

    // Get filter params
    const filterType = searchParams.get('type') || 'all'
    const filterStatus = searchParams.get('status') || 'all'
    const searchTerm = searchParams.get('search') || ''

    // Build query
    let query = supabase
      .from('communication_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    // Apply type filter (channel column)
    if (filterType !== 'all') {
      query = query.eq('channel', filterType)
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus)
    }

    // Apply search filter
    if (searchTerm) {
      query = query.or(`recipient.ilike.%${searchTerm}%,assessment_id::text.ilike.%${searchTerm}%`)
    }

    const { data: logs, error: logsError } = await query

    if (logsError) {
      console.error('[logs] Error fetching communication logs:', logsError)
      throw logsError
    }

    return NextResponse.json(
      {
        logs: logs || [],
        meta: {
          routeVersion: 'logs-v1',
          timestamp: new Date().toISOString(),
          count: logs?.length || 0
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
    console.error("[logs] Error fetching logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    )
  }
}
