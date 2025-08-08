import puppeteer from 'puppeteer';
import { browserPool, configurePage, PDF_OPTIONS } from '@/lib/puppeteer-config';
import { marked } from 'marked';
import matter from 'gray-matter';
import { getPdfHtmlTemplate } from './master-template';
import { logger } from '@/lib/logger';
import fs from 'fs/promises';
import { getGuideContent } from './content-loader';
import { replacePlaceholders } from '@/lib/pdf-helpers';
import { processMarkdownWithImages } from './image-processor';

// Configure marked to handle our markdown properly
marked.setOptions({
  breaks: true,
  gfm: true
});

// Helper function to get browser from pool
async function getBrowser() {
  logger.info('Getting browser instance from pool...');
  return await browserPool.getBrowser();
}

export async function generatePdfV2(
  markdownFilePath: string,
  assessmentData: any,
  tier: 'free' | 'enhanced' | 'monograph'
): Promise<Buffer> {
  let browser;
  let page;
  try {
    logger.info('Starting PDF generation', { 
      filePath: markdownFilePath, 
      tier, 
      assessmentId: assessmentData.id,
      environment: process.env.NODE_ENV,
      netlify: process.env.NETLIFY
    });

    // 1. Read the markdown content
    logger.info('Reading markdown file:', markdownFilePath);
    const markdownContent = await fs.readFile(markdownFilePath, 'utf-8');
    logger.info('Markdown content length:', markdownContent.length);
    
    if (!markdownContent) {
      throw new Error(`Markdown file is empty: ${markdownFilePath}`);
    }
    
    // 2. Parse frontmatter
    const { data: frontmatter, content: mainContent } = matter(markdownContent);
    
    if (!mainContent) {
      logger.error('Main content is undefined after parsing frontmatter');
      throw new Error('Failed to parse markdown content');
    }
    
    // 3. Clean the main content (remove section markers)
    let cleanedContent = mainContent || '';
    if (cleanedContent) {
      cleanedContent = cleanedContent
        .replace(/>>EXECUTIVE_SUMMARY[\s\S]*?>>END/g, '')
        .replace(/>>KEY_POINTS[\s\S]*?>>END/g, '')
        .replace(/<!--[\s\S]*?-->/g, '');
    }
    
    // Replace static placeholders
    if (cleanedContent) {
      cleanedContent = cleanedContent.replace(/\[Name Placeholder\]/g, assessmentData.name || 'Patient');
      cleanedContent = cleanedContent.replace(/\[Date Placeholder\]/g, new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    }
    
    // Replace dynamic placeholders if responses exist
    if (assessmentData.responses) {
      cleanedContent = replacePlaceholders(cleanedContent, assessmentData.responses);
    }
    
    // Process markdown to add images for monographs
    const pathParts = markdownFilePath.split("/");
    const fileName = pathParts.pop() || "";
    const condition = fileName ? fileName.replace(".md", "") : "";
    console.log(`Before image processing - Tier: ${tier}, Condition: ${condition}`);
    cleanedContent = processMarkdownWithImages(cleanedContent, condition, tier);
    console.log('After image processing, content includes <img>?', cleanedContent.includes('<img'));
    console.log('After image processing, content includes ![?', cleanedContent.includes('!['));
    
    // 4. Convert to HTML
    const contentAsHtml = await marked.parse(cleanedContent);
    console.log('HTML contains img tags?', contentAsHtml.includes('<img'));
    if (tier === 'monograph') {
      const imgCount = (contentAsHtml.match(/<img/g) || []).length;
      console.log(`Found ${imgCount} img tags in HTML`);
      if (imgCount > 0) {
        const firstImg = contentAsHtml.match(/<img[^>]+>/)?.[0];
        console.log('First img tag:', firstImg);
      }
    }
    
    // Check if images were added to HTML
    if (tier === 'monograph' && contentAsHtml.includes('<img')) {
      console.log('=== IMAGES FOUND IN HTML ===');
      const imgMatches = contentAsHtml.match(/<img[^>]+>/g);
      console.log('Image tags:', imgMatches?.slice(0, 3)); // Show first 3
    } else if (tier === 'monograph') {
      console.log('=== NO IMAGES IN HTML ===');
    }
    
    // 5. Pass frontmatter to template
    logger.info('Generating HTML template...');
    const fullHtml = getPdfHtmlTemplate(contentAsHtml, assessmentData, tier, frontmatter);
    logger.info('HTML template generated, length:', fullHtml.length);
    
    // 6. Launch Puppeteer and generate PDF
    console.info('Step 1: Getting browser from pool...');
    browser = await getBrowser();
    logger.info('Browser instance obtained from pool');
    
    page = await browser.newPage();
    await configurePage(page);
    
    // Set explicit viewport for consistent rendering across all tiers
    // Use wider viewport to prevent text wrapping issues
    await page.setViewport({ width: 1920, height: 2700 }); // Wide viewport for proper text flow
    console.info('Step 3: New page opened with A4 viewport. Setting content...');
    
    // Check if the HTML content is valid before setting it
    if (!fullHtml || typeof fullHtml !== 'string' || fullHtml.length < 50) {
      console.error('CRITICAL: Invalid or empty HTML content received!', { length: fullHtml?.length });
      throw new Error('Invalid or empty HTML content provided to PDF generator.');
    }
    console.info(`Step 4: HTML content is valid (length: ${fullHtml.length}). Awaiting page.setContent...`);
    
    // Add logging to check for images in HTML before setting content
    console.log('[PDF] About to set HTML content with length:', fullHtml.length);
    console.log('[PDF] HTML contains img tags:', fullHtml.includes('<img'));
    
    await page.setContent(fullHtml, { 
      waitUntil: 'networkidle0', // Try 'domcontentloaded' if images cause hanging
      timeout: 30000 
    });
    console.info('Step 5: Content set. Generating PDF...');
    console.log('[PDF] Content set successfully');
    logger.info('Page content set');
    
    // Before generating PDF, check if images loaded
    if (tier === 'monograph') {
      console.log('[PDF] Checking images in page...');
      try {
        const images = await page.evaluate(() => {
          const imgs = document.querySelectorAll('img');
          return Array.from(imgs).map(img => ({
            src: img.src,
            complete: img.complete,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
          }));
        });
        console.log('[PDF] Images found:', images.length);
        if (images.length > 0) {
          console.log('[PDF] First image:', images[0]);
        }
        
        // Smart wait for images with timeout
        console.info('[PDF] Waiting for images to load...');
        try {
          await page.waitForFunction(
            () => {
              const images = document.querySelectorAll('img');
              return Array.from(images).every(img => img.complete);
            },
            { timeout: 1000 } // 1 second max
          );
          console.log('[PDF] All images loaded successfully');
        } catch (e) {
          console.log('[PDF] Images did not fully load in 1s, continuing anyway');
        }
        
        // Save debug HTML (only in development)
        if (process.env.NODE_ENV === 'development' && !process.env.NETLIFY) {
          try {
            const debugHtml = await page.content();
            await fs.writeFile('debug-monograph.html', debugHtml);
            console.log('[PDF] Saved debug HTML to debug-monograph.html');
          } catch (debugError) {
            // Ignore debug file write errors (e.g., on read-only filesystems)
            console.log('[PDF] Could not save debug HTML (read-only filesystem)');
          }
        }
      } catch (error) {
        console.error('[PDF] Error checking images:', error);
      }
    }
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width: 100%; font-size: 10px; padding: 5px 0; text-align: center;">
          <span>© PainOptix™ Educational Content</span>
          <span style="float: right; margin-right: 20px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
      margin: {
        top: '0.75in',
        right: '0.5in',  // Reduced right margin for more text width
        bottom: '1in',
        left: '0.5in'    // Reduced left margin for more text width
      },
      // Set scale for proper text rendering
      ...(tier === 'monograph' ? {
        scale: 0.9,  // Slightly reduce scale to decrease file size
        preferCSSPageSize: false
      } : tier === 'enhanced' ? {
        scale: 1.0,  // Full scale for enhanced to prevent text wrapping
        preferCSSPageSize: false
      } : {})
    });
    
    console.info('Step 6: PDF Buffer created successfully.');
    logger.info('PDF generated successfully, size:', pdfBuffer.length);
    
    await browser.close();
    logger.info('Browser closed');
    
    return Buffer.from(pdfBuffer);
    
  } catch (error: any) {
    console.error('--- ERROR INSIDE PDF GENERATOR ---');
    // Log the actual error object to see the details
    console.error(error);
    logger.error('--- PDF Generation Failed ---');
    logger.error('Error:', error);
    logger.error('PDF generation error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Clean up page if it was opened
    if (page) {
      try {
        await page.close();
        logger.info('Page closed successfully.');
      } catch (closeError) {
        logger.error('Error closing page:', closeError);
      }
    }
    // Don't close the browser - let the pool manage it
    
    // Re-throw the original error with more context
    throw new Error(`Puppeteer Error: ${error.message}`);
  }
}

// Alternative function that uses pre-loaded content for serverless environments
export async function generatePdfFromContent(
  guideType: string,
  assessmentData: any,
  tier: 'free' | 'enhanced' | 'monograph'
): Promise<Buffer> {
  let browser;
  let page;
  try {
    logger.info('Starting PDF generation from pre-loaded content', { 
      guideType, 
      tier, 
      assessmentId: assessmentData.id,
      environment: process.env.NODE_ENV,
      netlify: process.env.NETLIFY
    });

    // 1. Get content - try pre-loaded first, then fallback to file system
    const contentDir = tier === 'monograph' ? 'monograph' : tier;
    let markdownContent = getGuideContent(contentDir, guideType);
    
    // If content not pre-loaded, try to read from file system
    if (!markdownContent) {
      logger.info(`Content not pre-loaded for ${contentDir}/${guideType}, attempting file system read`);
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const filePath = path.default.join(process.cwd(), 'content/guides', contentDir, `${guideType}.md`);
        markdownContent = await fs.readFile(filePath, 'utf-8');
        logger.info(`Successfully loaded content from file system`);
      } catch (fsError) {
        logger.error(`Failed to load content from file system:`, fsError);
        throw new Error(`Guide content not found: ${contentDir}/${guideType}`);
      }
    }
    
    if (!markdownContent) {
      throw new Error(`Guide content is empty: ${contentDir}/${guideType}`);
    }
    
    logger.info('Using content, length:', markdownContent.length);
    
    // 2. Parse frontmatter
    const { data: frontmatter, content: mainContent } = matter(markdownContent);
    
    if (!mainContent) {
      logger.error('Main content is undefined after parsing frontmatter');
      throw new Error('Failed to parse markdown content');
    }
    
    // 3. Clean the main content (remove section markers)
    let cleanedContent = mainContent || '';
    if (cleanedContent) {
      cleanedContent = cleanedContent
        .replace(/>>EXECUTIVE_SUMMARY[\s\S]*?>>END/g, '')
        .replace(/>>KEY_POINTS[\s\S]*?>>END/g, '')
        .replace(/<!--[\s\S]*?-->/g, '');
    }
    
    // Replace static placeholders
    if (cleanedContent) {
      cleanedContent = cleanedContent.replace(/\[Name Placeholder\]/g, assessmentData.name || 'Patient');
      cleanedContent = cleanedContent.replace(/\[Date Placeholder\]/g, new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    }
    
    // Replace dynamic placeholders if responses exist
    if (assessmentData.responses) {
      cleanedContent = replacePlaceholders(cleanedContent, assessmentData.responses);
    }
    
    // Process markdown to add images for monographs
    try {
      logger.info('Processing markdown with images...');
      cleanedContent = processMarkdownWithImages(cleanedContent, guideType, tier);
      logger.info('Markdown processing complete');
    } catch (imgError: any) {
      logger.error('Error processing images:', imgError);
      throw new Error(`Image processing failed: ${imgError.message}`);
    }
    
    // 4. Convert to HTML
    logger.info('Converting markdown to HTML...');
    const contentAsHtml = await marked.parse(cleanedContent);
    logger.info('HTML conversion complete, length:', contentAsHtml.length);
    
    // 5. Pass frontmatter to template
    logger.info('Generating HTML template...');
    const fullHtml = getPdfHtmlTemplate(contentAsHtml, assessmentData, tier, frontmatter);
    logger.info('HTML template generated, length:', fullHtml.length);
    
    // 6. Launch Puppeteer and generate PDF
    console.info('Step 1: Getting browser from pool...');
    browser = await getBrowser();
    logger.info('Browser instance obtained from pool');
    
    page = await browser.newPage();
    await configurePage(page);
    
    // Set explicit viewport for consistent rendering across all tiers
    // Use wider viewport to prevent text wrapping issues
    await page.setViewport({ width: 1920, height: 2700 }); // Wide viewport for proper text flow
    console.info('Step 3: New page opened with A4 viewport. Setting content...');
    
    // Check if the HTML content is valid before setting it
    if (!fullHtml || typeof fullHtml !== 'string' || fullHtml.length < 50) {
      console.error('CRITICAL: Invalid or empty HTML content received!', { length: fullHtml?.length });
      throw new Error('Invalid or empty HTML content provided to PDF generator.');
    }
    console.info(`Step 4: HTML content is valid (length: ${fullHtml.length}). Awaiting page.setContent...`);
    
    // Add logging to check for images in HTML before setting content
    console.log('[PDF] About to set HTML content with length:', fullHtml.length);
    console.log('[PDF] HTML contains img tags:', fullHtml.includes('<img'));
    
    await page.setContent(fullHtml, { 
      waitUntil: 'networkidle0', // Try 'domcontentloaded' if images cause hanging
      timeout: 30000 
    });
    console.info('Step 5: Content set. Generating PDF...');
    console.log('[PDF] Content set successfully');
    logger.info('Page content set');
    
    // Before generating PDF, check if images loaded
    if (tier === 'monograph') {
      console.log('[PDF] Checking images in page...');
      try {
        const images = await page.evaluate(() => {
          const imgs = document.querySelectorAll('img');
          return Array.from(imgs).map(img => ({
            src: img.src,
            complete: img.complete,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
          }));
        });
        console.log('[PDF] Images found:', images.length);
        if (images.length > 0) {
          console.log('[PDF] First image:', images[0]);
        }
        
        // Smart wait for images with timeout
        console.info('[PDF] Waiting for images to load...');
        try {
          await page.waitForFunction(
            () => {
              const images = document.querySelectorAll('img');
              return Array.from(images).every(img => img.complete);
            },
            { timeout: 1000 } // 1 second max
          );
          console.log('[PDF] All images loaded successfully');
        } catch (e) {
          console.log('[PDF] Images did not fully load in 1s, continuing anyway');
        }
        
        // Save debug HTML (only in development)
        if (process.env.NODE_ENV === 'development' && !process.env.NETLIFY) {
          try {
            const debugHtml = await page.content();
            await fs.writeFile('debug-monograph.html', debugHtml);
            console.log('[PDF] Saved debug HTML to debug-monograph.html');
          } catch (debugError) {
            // Ignore debug file write errors (e.g., on read-only filesystems)
            console.log('[PDF] Could not save debug HTML (read-only filesystem)');
          }
        }
      } catch (error) {
        console.error('[PDF] Error checking images:', error);
      }
    }
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width: 100%; font-size: 10px; padding: 5px 0; text-align: center;">
          <span>© PainOptix™ Educational Content</span>
          <span style="float: right; margin-right: 20px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
      margin: {
        top: '0.75in',
        right: '0.5in',  // Reduced right margin for more text width
        bottom: '1in',
        left: '0.5in'    // Reduced left margin for more text width
      },
      // Set scale for proper text rendering
      ...(tier === 'monograph' ? {
        scale: 0.9,  // Slightly reduce scale to decrease file size
        preferCSSPageSize: false
      } : tier === 'enhanced' ? {
        scale: 1.0,  // Full scale for enhanced to prevent text wrapping
        preferCSSPageSize: false
      } : {})
    });
    
    console.info('Step 6: PDF Buffer created successfully.');
    logger.info('PDF generated successfully, size:', pdfBuffer.length);
    
    await browser.close();
    logger.info('Browser closed');
    
    return Buffer.from(pdfBuffer);
    
  } catch (error: any) {
    console.error('--- ERROR INSIDE PDF GENERATOR ---');
    // Log the actual error object to see the details
    console.error(error);
    logger.error('--- PDF Generation Failed ---');
    logger.error('Error:', error);
    logger.error('PDF generation error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Clean up page if it was opened
    if (page) {
      try {
        await page.close();
        logger.info('Page closed successfully.');
      } catch (closeError) {
        logger.error('Error closing page:', closeError);
      }
    }
    // Don't close the browser - let the pool manage it
    
    // Re-throw the original error with more context
    throw new Error(`Puppeteer Error: ${error.message}`);
  }
}
