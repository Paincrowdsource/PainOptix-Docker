import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { generatePdfV2, generatePdfFromContent } from '@/lib/pdf/puppeteer-generator';
import { generateSimplePDF } from '@/lib/pdf/simple-pdf-generator';
import { mapUrlTierToDb } from '@/lib/utils/tier-mapping';
import { logger } from '@/lib/logger';
import path from 'path';
import fs from 'fs/promises';

async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { assessmentId, tier: requestedTier } = body;

    if (!assessmentId) {
      return new Response(JSON.stringify({ message: 'Assessment ID is required.' }), { status: 400 });
    }

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

    // Map tier to content directory (comprehensive -> monograph)
    const contentDir = actualTier === 'comprehensive' ? 'monograph' : actualTier;
    const puppeteerTier = actualTier === 'comprehensive' ? 'monograph' : actualTier as 'free' | 'enhanced' | 'monograph';

    // Generate PDF
    let pdfBuffer: Buffer;
    
    try {
      if (process.env.NODE_ENV === 'production' || process.env.NETLIFY) {
        // Production: Use pre-loaded content
        logger.info(`Generating PDF from pre-loaded content`, {
          tier: puppeteerTier,
          guideType: guideType,
          contentDir: contentDir
        });
        
        pdfBuffer = await generatePdfFromContent(guideType, assessmentData, puppeteerTier);
      } else {
        // Development: Use file system
        const filePath = path.join(process.cwd(), 'content/guides', contentDir, `${guideType}.md`);
        
        logger.info(`Generating PDF from file system`, {
          tier: puppeteerTier,
          filePath: filePath,
          guideType: guideType,
          contentDir: contentDir
        });
        
        pdfBuffer = await generatePdfV2(filePath, assessmentData, puppeteerTier);
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
    
    // Return the PDF
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="painoptix-${guideType}-${actualTier}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('--- CRITICAL ERROR in download-guide API ---');
    console.error(error);
    return new Response(JSON.stringify({ message: 'An unexpected error occurred.', error: error.message }), { status: 500 });
  }
}