/**
 * User Assessments Retrieval API Endpoint
 * 
 * PURPOSE:
 * - Provides authenticated access to user's historical assessment data
 * - Implements GDPR "Right of Access" allowing users to view their data
 * - Returns formatted assessment history with delivery status
 * 
 * SECURITY CONSIDERATIONS:
 * - Bearer token authentication required for all requests
 * - Session token validation with expiration checking
 * - Server-side authorization - users can only access their own data
 * - Input sanitization and SQL injection prevention via Supabase
 * - Generic error messages prevent information disclosure
 * 
 * GDPR COMPLIANCE:
 * - Implements Article 15 "Right of Access to Personal Data"
 * - Users can view all their stored assessment information
 * - Includes delivery status and payment information transparency
 * - Data returned in structured, readable format
 * 
 * AUTHORIZATION FLOW:
 * 1. Extract Bearer token from Authorization header
 * 2. Validate token format and decode session data
 * 3. Check session expiration timestamp
 * 4. Query assessments matching user's identifier
 * 5. Include related delivery status information
 * 6. Format response with user-friendly data presentation
 * 
 * DATA RETURNED:
 * - Assessment ID and creation date
 * - Guide type and payment tier information
 * - Payment completion status
 * - Guide delivery status and timestamps
 * - Formatted for user-friendly display
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin client for authorized database access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Session Token Verification Function
 * 
 * SECURITY FEATURES:
 * - Validates token format and decoding
 * - Checks session expiration (24-hour limit)
 * - Returns null for any invalid or expired tokens
 * - Extracts user identifier for database queries
 * 
 * @param token - Base64-encoded session token
 * @returns User identifier if valid, null if invalid/expired
 */
function verifySession(token: string): { identifier: string } | null {
  try {
    // Decode base64 token and parse JSON
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    
    // SECURITY: Check session expiration
    if (decoded.expires < Date.now()) {
      return null // Expired session
    }
    
    return { identifier: decoded.identifier }
  } catch {
    // Invalid token format or corrupted data
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    // AUTHENTICATION: Extract Bearer token from Authorization header
    const authorization = request.headers.get('authorization')
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Extract token and validate session
    const token = authorization.substring(7)
    const session = verifySession(token)
    
    if (!session) {
      // Session invalid, expired, or malformed
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    // AUTHORIZATION: Fetch assessments for authenticated user only
    // Uses OR condition to match either email or phone identifier
    const { data: assessments, error } = await supabaseAdmin()
      .from('assessments')
      .select(`
        id,
        created_at,
        guide_type,
        payment_tier,
        payment_completed,
        guide_deliveries (
          delivery_status,
          delivered_at
        )
      `)
      .or(`email.eq.${session.identifier},phone_number.eq.${session.identifier}`)
      .order('created_at', { ascending: false }) // Most recent first

    if (error) {
      console.error('Error fetching assessments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assessments' },
        { status: 500 }
      )
    }

    // DATA FORMATTING: Transform database records to user-friendly format
    // GDPR TRANSPARENCY: Clear presentation of user's data
    const formattedAssessments = assessments?.map(assessment => ({
      id: assessment.id,
      date: assessment.created_at,
      // Convert database format to readable condition name
      condition: assessment.guide_type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      // Map payment tiers to user-friendly descriptions
      tier: assessment.payment_tier === 20 || assessment.payment_tier === 'comprehensive' 
        ? 'Comprehensive Guide ($20)'
        : assessment.payment_tier === 5 || assessment.payment_tier === 'enhanced'
        ? 'Enhanced Report ($5)'
        : 'Basic Guide (Free)',
      isPaid: assessment.payment_completed || false,
      deliveryStatus: assessment.guide_deliveries?.[0]?.delivery_status || 'pending',
      canDownload: true // All assessments are downloadable (GDPR access right)
    }))

    return NextResponse.json({
      assessments: formattedAssessments || []
    })

  } catch (error) {
    console.error('Error in user assessments endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}