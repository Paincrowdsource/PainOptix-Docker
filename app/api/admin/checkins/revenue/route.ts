import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin/auth";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const isAdmin = await isAdminRequest(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getServiceSupabase();

    const { data: revenueData, error: revenueError } = await supabase
      .from('revenue_events')
      .select('*')
      .like('source', 'checkin_%')
      .order('created_at', { ascending: false });

    if (revenueError) {
      throw revenueError;
    }

    return NextResponse.json({ revenue: revenueData || [] }, { status: 200 });
  } catch (error) {
    console.error("Error fetching revenue:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue data" },
      { status: 500 }
    );
  }
}
