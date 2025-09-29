import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { generatePdfV2, generatePdfFromContent } from '@/lib/pdf/puppeteer-generator';
import { generateSimplePDF } from '@/lib/pdf/simple-pdf-generator';
import { mapUrlTierToDb } from '@/lib/utils/tier-mapping';
import { logger } from '@/lib/logger';
import path from 'path';
import fs from 'fs/promises';

// Force Node.js runtime for Puppeteer
export const runtime = 'nodejs';

async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let pdfLogId: string | null = null;

  try {
    // Check query params first (for admin tests)
    const { searchParams } = new URL(req.url);
    let assessmentId = searchParams.get('assessmentId');
    let requestedTier = searchParams.get('tier');

    // If not in query params, try to parse body
    if (!assessmentId) {
      try {
        const body = await req.json();
        assessmentId = body.assessmentId;
        requestedTier = body.tier || requestedTier;
      } catch (e) {
        // No body or invalid JSON, continue with query params
      }
    }

    if (!assessmentId) {
      return new Response(JSON.stringify({ message: 'Assessment ID is required.' }), { status: 400 });
    }

    // Feature flag for Enhanced V2 - only activates when explicitly enabled
    const envFlag = process.env.ENHANCED_V2 === '1' || process.env.ENHANCED_V2 === 'true';
    const headerFlag = req.headers.get('x-po-enhanced-v2') === '1';
    
    console.info(`PDF download request: assessmentId=${assessmentId}, tier=${requestedTier}`);

    // ---- UNIFIED DATA RETRIEVAL ----
    let assessmentData;
    let actualTier;

    if (assessmentId.startsWith('admin-test-')) {
      // Admin test: Create mock data
      console.info('ADMIN TEST: Creating mock assessment data.');
      const guideType = assessmentId.split('-')[2]; // Extract guide type from admin-test-{guideType}
      actualTier = requestedTier || 'free'; // Use the requested tier directly

      assessmentData = {
        id: assessmentId,
        name: 'Test User',
        initial_pain_score: 7,
        payment_tier: actualTier,
        guide_type: guideType,
        created_at: new Date().toISOString(),
        responses: {
          painLocation: 'lower back',
          painTriggers: 'sitting and bending',
          relievingFactors: 'lying down and walking',
          radiation: 'one_leg_below_knee',
          numbness: 'yes',
          numbLocation: 'the left foot and outer calf',
          duration: '3-6 months',
          severity: '5',
          location: 'lower_back',
          aggravating: ['sitting', 'bending'],
          relieving: ['walking', 'lying_down']
        }
      };
    } else {
      // Real user: Fetch from database
      console.info('REAL USER: Fetching assessment from database.');
      const supabase = getServiceSupabase();
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (error || !data) {
        console.error('Assessment not found:', error);
        return new Response(JSON.stringify({ message: 'Assessment not found.' }), { status: 404 });
      }

      assessmentData = data;
      actualTier = requestedTier || data.payment_tier || 'free';
    }

    // ---- UNIFIED CONTENT RETRIEVAL ----
    const guideType = assessmentData.guide_type;
    console.info(`Generating PDF: guideType=${guideType}, tier=${actualTier}`);

    // Create PDF generation log entry if not admin test
    if (!assessmentId.startsWith('admin-test-')) {
      const supabase = getServiceSupabase();
      const { data: logEntry } = await supabase
        .from('pdf_generation_logs')
        .insert({
          assessment_id: assessmentId,
          tier: actualTier,
          status: 'started',
          started_at: new Date().toISOString(),
          requested_by: 'api',
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null
        })
        .select('id')
        .single();

      if (logEntry) {
        pdfLogId = logEntry.id;
      }
    }

    // Map tier to content directory (comprehensive -> monograph)
    const contentDir = actualTier === 'comprehensive' ? 'monograph' : actualTier;
    const puppeteerTier = actualTier === 'comprehensive' ? 'monograph' : actualTier as 'free' | 'enhanced' | 'monograph';

    // Compute Enhanced V2 flag - only for enhanced tier and when explicitly enabled
    const enhancedV2Enabled = puppeteerTier === 'enhanced' && (envFlag || headerFlag);
    if (enhancedV2Enabled) {
      console.info('Enhanced V2 formatting enabled via flag');
    }

    // Generate PDF
    let pdfBuffer: Buffer;
    
    try {
      if (process.env.NODE_ENV === 'production' || process.env.NETLIFY) {
        // Production: Use pre-loaded content
        logger.info(`Generating PDF from pre-loaded content`, {
          tier: puppeteerTier,
          guideType: guideType,
          contentDir: contentDir,
          enhancedV2Enabled
        });
        
        pdfBuffer = await generatePdfFromContent(guideType, assessmentData, puppeteerTier, { enhancedV2Enabled });
      } else {
        // Development: Use file system
        const filePath = path.join(process.cwd(), 'content/guides', contentDir, `${guideType}.md`);
        
        logger.info(`Generating PDF from file system`, {
          tier: puppeteerTier,
          filePath: filePath,
          guideType: guideType,
          contentDir: contentDir,
          enhancedV2Enabled
        });
        
        pdfBuffer = await generatePdfV2(filePath, assessmentData, puppeteerTier, { enhancedV2Enabled });
      }
    } catch (puppeteerError: any) {
      logger.error('Puppeteer PDF generation failed:', {
        message: puppeteerError.message,
        stack: puppeteerError.stack,
        name: puppeteerError.name
      });
      
      // For now, DO NOT fall back to simple PDF - we need to fix Puppeteer
      // The client requires high-quality PDFs with images
      throw new Error(`Puppeteer PDF generation failed: ${puppeteerError.message}. Full-quality PDF generation is required.`);
      
      // Commented out fallback - we'll re-enable once Puppeteer is fixed
      /*
      try {
        pdfBuffer = await generateSimplePDF(guideType, assessmentData, puppeteerTier);
        logger.info('Successfully generated PDF using simple fallback');
      } catch (simplePdfError: any) {
        logger.error('Simple PDF generation also failed:', simplePdfError);
        throw new Error(`PDF generation failed: ${puppeteerError.message}`);
      }
      */
    }

    // Log PDF size for debugging
    const pdfSizeMB = (pdfBuffer.length / (1024 * 1024)).toFixed(2);
    console.info(`PDF generated successfully. Size: ${pdfSizeMB}MB`);

    // Check if PDF is too large (Netlify has a 10MB limit for synchronous functions)
    if (pdfBuffer.length > 10 * 1024 * 1024) {
      console.warn(`Warning: PDF size (${pdfSizeMB}MB) exceeds recommended limit`);
    }

    // Update PDF generation log with success
    if (pdfLogId) {
      const supabase = getServiceSupabase();
      const duration = Date.now() - startTime;
      await supabase
        .from('pdf_generation_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          duration_ms: duration,
          file_size_bytes: pdfBuffer.length,
          page_count: null // Would need to extract from PDF metadata
        })
        .eq('id', pdfLogId);
    }
    
    // Return the PDF with proper body type for Node runtime
    const pdfBody = new Uint8Array(pdfBuffer); // Convert Buffer to Uint8Array for proper BodyInit
    return new Response(pdfBody, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="painoptix-${guideType}-${actualTier}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('--- CRITICAL ERROR in download-guide API ---');
    console.error(error);

    // Update PDF generation log with failure
    if (pdfLogId) {
      const supabase = getServiceSupabase();
      const duration = Date.now() - startTime;
      await supabase
        .from('pdf_generation_logs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          duration_ms: duration,
          error_message: error.message || 'Unknown error'
        })
        .eq('id', pdfLogId);
    }

    return new Response(JSON.stringify({ message: 'An unexpected error occurred.', error: error.message }), { status: 500 });
  }
}