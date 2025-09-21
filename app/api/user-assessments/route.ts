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
import { supabaseAdmin } from '@/lib/supabase-admin'

// Admin client for authorized database access

