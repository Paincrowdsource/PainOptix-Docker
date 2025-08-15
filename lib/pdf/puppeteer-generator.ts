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
// import { enhancedDomGlueShipScript } from './enhanced-dom-glue-ship'; // Removed - file not in docker-repo

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
  tier: 'free' | 'enhanced' | 'monograph',
  options: { enhancedV2Enabled?: boolean } = {}
): Promise<Buffer> {
  let browser;
  let page;
  
  // COMPREHENSIVE DEBUG LOGGING
  console.log('=== PDF GENERATION DEBUG ===');
  console.log('Function: generatePdfV2 (from file)');
  console.log('Assessment ID:', assessmentData.id || 'N/A');
  console.log('Guide Type:', assessmentData.guide_type || assessmentData.guideType || 'N/A');
  // Fix for Windows paths - handle both / and \
  const pathSeparator = markdownFilePath.includes('\\') ? '\\' : '/';
  const extractedCondition = markdownFilePath.split(pathSeparator).pop()?.replace('.md', '') || 'N/A';
  console.log('Condition:', extractedCondition);
  console.log('Tier:', tier);
  console.log('Enhanced V2 Enabled:', options.enhancedV2Enabled);
  console.log('ENHANCED_V2 env:', process.env.ENHANCED_V2);
  console.log('Markdown file:', markdownFilePath);
  console.log('=========================');
  
  try {
    logger.info('Starting PDF generation', { 
      filePath: markdownFilePath, 
      tier, 
      assessmentId: assessmentData.id,
      environment: process.env.NODE_ENV,
      netlify: process.env.NETLIFY,
      enhancedV2Enabled: options.enhancedV2Enabled
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
    
    // DEBUG: Check frontmatter title
    console.log('[DEBUG] Original frontmatter title:', frontmatter.title);
    console.log('[DEBUG] Has "Learn About" in title?', frontmatter.title?.includes('Learn About'));
    
    // FIX: Remove "Learn About" from title if present
    if (frontmatter.title && frontmatter.title.includes('Learn About')) {
      frontmatter.title = frontmatter.title.replace('Learn About ', '').replace('Learn About', '').trim();
      console.log('[DEBUG] Fixed frontmatter title:', frontmatter.title);
    }
    
    // FIX: Ensure proper condition name for cover
    if (frontmatter.title === 'Pain Assessment Guide') {
      const conditionMap: Record<string, string> = {
        'sciatica': 'Sciatica',
        'upper_lumbar_radiculopathy': 'Upper Lumbar Radiculopathy',
        'si_joint_dysfunction': 'SI Joint Dysfunction',
        'canal_stenosis': 'Spinal Canal Stenosis',
        'central_disc_bulge': 'Central Disc Bulge',
        'facet_arthropathy': 'Facet Arthropathy',
        'muscular_nslbp': 'Muscular Non-Specific Low Back Pain',
        'lumbar_instability': 'Lumbar Instability',
        'urgent_symptoms': 'Urgent Symptoms'
      };
      const condition = assessmentData.guide_type || assessmentData.guideType || '';
      frontmatter.title = conditionMap[condition] || 'Pain Assessment Guide';
      console.log('[DEBUG] Replaced generic title with:', frontmatter.title);
    }
    
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
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/^END$/gm, '')  // Remove standalone END lines
        .replace(/^DISCLAIMER$/gm, '## Disclaimer');  // Convert DISCLAIMER to heading
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
    // FIX: Handle both Windows (\) and Unix (/) path separators
    const pathSeparator = markdownFilePath.includes('\\') ? '\\' : '/';
    const pathParts = markdownFilePath.split(pathSeparator);
    const fileName = pathParts.pop() || "";
    const condition = fileName ? fileName.replace(".md", "") : "";
    console.log(`Before image processing - Tier: ${tier}, Condition: ${condition}`);
    cleanedContent = processMarkdownWithImages(cleanedContent, condition, tier);
    console.log('After image processing, content includes <img>?', cleanedContent.includes('<img'));
    console.log('After image processing, content includes ![?', cleanedContent.includes('!['));
    
    // Enhanced V2: Clean markdown processing
    console.log('[V2-CHECK] About to check V2 conditions. Tier:', tier, 'V2 Enabled:', options.enhancedV2Enabled);
    if (tier === 'enhanced' && options.enhancedV2Enabled) {
      console.log('[ENHANCED-V2] Applying clean markdown processing - V2 IS ACTIVE');
      
      // AGGRESSIVE HTML CLEANUP - Remove all br tags before markdown processing
      cleanedContent = cleanedContent.replace(/<br\s*\/?>/gi, ' ');
      cleanedContent = cleanedContent.replace(/&lt;br\s*\/?&gt;/gi, ' ');
      
      // Get human-readable condition name
      const conditionNames: Record<string, string> = {
        'si_joint_dysfunction': 'Sacroiliac Joint Pain',
        'sciatica': 'Sciatica',
        'facet_arthropathy': 'Facet Joint Arthropathy',
        'muscular_nslbp': 'Muscular Lower Back Pain',
        'central_disc_bulge': 'Central Disc Bulge',
        'canal_stenosis': 'Spinal Canal Stenosis',
        'lumbar_instability': 'Lumbar Instability',
        'upper_lumbar_radiculopathy': 'Upper Lumbar Radiculopathy',
        'urgent_symptoms': 'Urgent Symptoms'
      };
      // DEBUG: Log what we're working with
      console.log('[TITLE-DEBUG] condition from path:', condition);
      console.log('[TITLE-DEBUG] assessmentData.guide_type:', assessmentData.guide_type);
      console.log('[TITLE-DEBUG] assessmentData.guideType:', assessmentData.guideType);
      
      // Use guide_type from assessment data if available, fallback to extracted condition
      const actualCondition = assessmentData.guide_type || assessmentData.guideType || condition;
      const conditionName = conditionNames[actualCondition] || actualCondition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      console.log('[TITLE-DEBUG] actualCondition:', actualCondition);
      console.log('[TITLE-DEBUG] conditionName:', conditionName);
      
      // Fix "Learn About" title to include condition name with proper spacing
      // Handle various formats: with or without #, with partial text
      cleanedContent = cleanedContent.replace(/^(#+\s*)?Learn About\s*.*$/m, `\n## Learn About ${conditionName}\n\n`);
      
      // Keep citations attached to their preceding text with non-breaking space
      // First, glue author name to year within citations to prevent [Weber, 1983] from splitting
      cleanedContent = cleanedContent.replace(/\[([^,]+),\s+(\d{4})\]/g, '[$1,\u00A0$2]');
      // Also handle other citation formats with commas
      cleanedContent = cleanedContent.replace(/\[([A-Z][a-z]+),\s+/g, '[$1,\u00A0');
      // Then ensure the whole citation stays with preceding text
      cleanedContent = cleanedContent.replace(/(\S+)\s+(\[[^\]]+\])/g, '$1\u00A0$2');
      
      // NUCLEAR OPTION: Shorten DOI URLs to prevent breaking
      // Remove https:// prefix to make URLs shorter
      cleanedContent = cleanedContent.replace(/https:\/\/doi\.org\//g, 'doi.org/');
      
      // DEBUG: Check for DOI URLs
      const doiCount = (cleanedContent.match(/doi\.org/g) || []).length;
      console.log('[DEBUG] DOI URLs found after shortening:', doiCount);
      
      // Clean up bullets - ensure consistent formatting
      cleanedContent = cleanedContent.replace(/^[•·]\s*/gm, '• ');
      cleanedContent = cleanedContent.replace(/^\*\s+/gm, '• ');
      
      // Fix quotes and special characters
      cleanedContent = cleanedContent.replace(/[""]/g, '"');
      cleanedContent = cleanedContent.replace(/['']/g, "'");
      cleanedContent = cleanedContent.replace(/–/g, '-');
      cleanedContent = cleanedContent.replace(/—/g, '-');
      
      // Ensure proper spacing around citations
      cleanedContent = cleanedContent.replace(/\s*(\[[^\]]+\])/g, ' $1');
      
      // Fix word( patterns - ensure space before parenthesis
      cleanedContent = cleanedContent.replace(/(\w)\(/g, '$1 (');
      
      // Process bibliography section with proper formatting
      const bibliographyRegex = /^(##?\s*(?:Bibliography|References))$([\s\S]*?)$/m;
      cleanedContent = cleanedContent.replace(bibliographyRegex, (match, title, content) => {
        let fixedContent = content;
        
        // Remove https:// prefixes to shorten URLs
        fixedContent = fixedContent.replace(/https:\/\//g, '');
        
        // Remove END markers
        fixedContent = fixedContent.replace(/\bEND\b(?!\w)/g, '');
        fixedContent = fixedContent.replace(/^END$/gm, '');
        
        // Split by numbers followed by period and reformat
        const entries = fixedContent.split(/(?=\d+\.)/g)
          .filter(entry => entry.trim())
          .map(entry => {
            // Ensure proper formatting with line break before each entry
            return entry.trim().replace(/^(\d+)\.\s*/, '\n$1. ');
          });
        
        console.log('[DEBUG] Processing bibliography section');
        
        return `${title}\n${entries.join('\n')}`;
      });
      
      console.log('[ENHANCED-V2] Clean markdown processing completed');
    }
    
    // 4. Convert to HTML
    let contentAsHtml = await marked.parse(cleanedContent);
    console.log('HTML contains img tags?', contentAsHtml.includes('<img'));
    
    // Post-HTML cleanup for any remaining artifacts
    if (tier === 'enhanced' && options.enhancedV2Enabled) {
      // Final cleanup of any HTML br tags that might have been generated
      contentAsHtml = contentAsHtml.replace(/<br\s*\/?>/gi, ' ');
      contentAsHtml = contentAsHtml.replace(/&lt;br\s*\/?&gt;/gi, ' ');
    }
    
    // Post-process HTML to fix bibliography DOI URLs for Enhanced V2
    if (tier === 'enhanced' && options.enhancedV2Enabled) {
      // Wrap DOI URLs in non-breaking spans
      contentAsHtml = contentAsHtml.replace(
        /<a[^>]*href="https:\/\/doi\.org\/[^"]*"[^>]*>([^<]*)<\/a>/g,
        (match: string) => {
          return `<span style="white-space: nowrap; display: inline-block;">${match}</span>`;
        }
      );
      
      // Also handle plain text DOI URLs in bibliography
      contentAsHtml = contentAsHtml.replace(
        /(?<!<[^>]*)https:\/\/doi\.org\/[^\s<]+/g,
        (match: string) => {
          return `<span style="white-space: nowrap;">${match}</span>`;
        }
      );
    }
    if (tier === 'monograph') {
      const imgCount = (contentAsHtml.match(/<img/g) || []).length;
      console.log(`Found ${imgCount} img tags in HTML`);
      if (imgCount > 0) {
        const firstImg = contentAsHtml.match(/<img[^>]+>/)?.[0];
        console.log('First img tag:', firstImg);
      }
    }
    
    // LOG ENHANCED PATH ENTRY
    console.log('[ENHANCED-PATH-ENTRY]', {
      inputTier: tier,
      env: {
        ENHANCED_PARAGRAPH_BULLETS: process.env.ENHANCED_PARAGRAPH_BULLETS,
        ENHANCED_RENDERER: process.env.ENHANCED_RENDERER
      },
      slug: assessmentData?.guide_type
    });
    
    // LOG PRE-HTML SUMMARY
    console.log('[ENHANCED-PRE-HTML-SUMMARY]', {
      hasUL: /<ul/i.test(contentAsHtml),
      hasLI: /<li/i.test(contentAsHtml),
      len: contentAsHtml.length
    });
    
    // Enhanced tier optimizations - only apply if V2 is enabled
    if (tier === 'enhanced' && options.enhancedV2Enabled) {
      console.log('Applying Enhanced V2 tier optimizations (flag enabled)...');
      
      // Step 1: Transform lists to hanging-bullet paragraphs
      // This matches DOCX formatting and prevents bad wrapping
      const transformLists = (html: string): string => {
        // Handle unordered lists
        html = html.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, listContent) => {
          // Transform each <li> to a hanging bullet paragraph
          const items = listContent.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (liMatch: string, liContent: string) => {
            // Clean up the content (remove nested tags if needed)
            const cleanContent = liContent.trim();
            return `<p class="enh-bullet"><span class="dot">•</span><span class="txt">${cleanContent}</span></p>`;
          });
          return items;
        });
        
        // Handle ordered lists similarly
        let olCounter = 1;
        html = html.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, listContent) => {
          olCounter = 1; // Reset counter for each list
          const items = listContent.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (liMatch: string, liContent: string) => {
            const cleanContent = liContent.trim();
            const num = olCounter++;
            return `<p class="enh-bullet"><span class="dot">${num}.</span><span class="txt">${cleanContent}</span></p>`;
          });
          return items;
        });
        
        return html;
      };
      
      contentAsHtml = transformLists(contentAsHtml);
      
      // LOG AFTER LIST TRANSFORM
      console.log('[ENHANCED-LIST-TRANSFORM]', {
        enhBullets: (contentAsHtml.match(/class="enh-bullet"/g) || []).length,
        remainingLI: (contentAsHtml.match(/<li/gi) || []).length
      });
      
      // Step 2: Wrap citations with preceding word to prevent orphaning
      // This keeps the last word before a citation together with the citation
      contentAsHtml = contentAsHtml.replace(
        /(\b[^\s<]+)\s+(\[[^\]]+\])/g,
        '<span class="nowrap">$1 $2</span>'
      );
      
      // Step 3: Protect problematic phrases from breaking
      const problemPhrases = [
        'reduce discomfort',
        'checking spine mobility',
        'with light movement',
        'spine mobility',
        'lumbar support',
        'gentle walking',
        'conservative care',
        'medical guidelines',
        'physical exam',
        'medical history',
        'facet arthropathy',
        'cauda equina'
      ];
      
      problemPhrases.forEach(phrase => {
        const regex = new RegExp(`\\b(${phrase})\\b`, 'gi');
        contentAsHtml = contentAsHtml.replace(
          regex,
          '<span class="nowrap">$1</span>'
        );
      });
      
      // Step 4: Protect parenthetical expressions
      contentAsHtml = contentAsHtml.replace(
        /\(e\.g\.[^)]{1,40}\)/g,
        (match: string) => `<span class="nowrap">${match}</span>`
      );
      
      // Step 5: Keep numbers with their units
      contentAsHtml = contentAsHtml.replace(/(\d+)\s+(weeks?|months?|years?|days?|hours?|minutes?)/gi, '$1&nbsp;$2');
      contentAsHtml = contentAsHtml.replace(/(\d+)\s*–\s*(\d+)/g, '$1–$2');
      contentAsHtml = contentAsHtml.replace(/(\d+)%/g, '$1%');
      
      // Step 6: Feature flag check (for rollback capability)
      const useEnhancedBullets = process.env.ENHANCED_PARAGRAPH_BULLETS !== 'false';
      if (!useEnhancedBullets) {
        console.log('Enhanced paragraph bullets disabled via ENHANCED_PARAGRAPH_BULLETS env var');
        // Revert to original HTML if feature is disabled
        contentAsHtml = await marked.parse(cleanedContent);
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
    let fullHtml = getPdfHtmlTemplate(contentAsHtml, assessmentData, tier, frontmatter);
    logger.info('HTML template generated, length:', fullHtml.length);
    
    // No special processing needed - clean HTML generation
    
    // DEBUG: Save HTML for comparison
    if (tier === 'enhanced' && options.enhancedV2Enabled) {
      try {
        const debugPath = `debug-${assessmentData.guide_type}-enhanced-v2.html`;
        await fs.writeFile(debugPath, fullHtml);
        console.log(`[DEBUG] Saved HTML to ${debugPath}`);
      } catch (e) {
        console.log('[DEBUG] Could not save HTML:', e);
      }
    }
    
    // 6. Launch Puppeteer and generate PDF
    console.info('Step 1: Getting browser from pool...');
    browser = await getBrowser();
    logger.info('Browser instance obtained from pool');
    
    page = await browser.newPage();
    await configurePage(page);
    
    // Pipe browser console to Node console
    page.on('console', msg => console.log('[PAGE]', msg.text()));
    
    // Set viewport to match US Letter size properly (not A4!)
    await page.setViewport({ 
      width: 816,  // 8.5 inches * 96 DPI
      height: 1056, // 11 inches * 96 DPI
      deviceScaleFactor: 1 
    });
    console.info('Step 3: New page opened with US Letter viewport. Setting content...');
    console.log('[WIDTH-DEBUG] Page viewport:', await page.viewport());
    
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
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    console.info('Step 5: Content set. Checking dimensions...');
    
    // Check actual dimensions for overflow
    const dimensions = await page.evaluate(() => {
      return {
        bodyWidth: document.body.scrollWidth,
        bodyHeight: document.body.scrollHeight,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        overflow: document.body.scrollWidth > window.innerWidth
      };
    });
    console.log('[WIDTH-DEBUG] Actual dimensions:', dimensions);
    if (dimensions.overflow) {
      console.warn('[WARNING] Content is overflowing the page width!');
    }
    
    console.log('[PDF] Content set successfully');
    logger.info('Page content set');
    
    // Enhanced V2: Clean markdown processing approach (DOM manipulation disabled)
    if (tier === 'enhanced' && options.enhancedV2Enabled) {
      console.log('[ENHANCED-V2] Using clean markdown processing - DOM manipulation disabled');
      
      // Add clean print styles and prevent awkward breaks
      await page.addStyleTag({ content: `
        /* Enhanced V2 Typography - Optimized for readability */
        body {
          font-size: 11pt !important;  /* Slightly smaller to fit better */
          line-height: 1.5 !important;
          padding: 0;
          margin: 0;
          width: 100%;
          box-sizing: border-box;
        }
        
        /* Content width constraints */
        .content, p, li, div {
          max-width: 7in !important;  /* Full usable width (8.5 - 0.75 - 0.75) */
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          hyphens: auto !important;  /* Allow hyphenation when needed */
        }
        
        h2 { 
          font-size: 16pt !important;
          margin-top: 1.5em !important;
        }
        
        h3 { 
          font-size: 14pt !important;
          margin-top: 1.2em !important;
        }
        
        /* Prevent awkward line breaks */
        p, li {
          hyphens: none !important;
          word-break: normal !important;
          overflow-wrap: normal !important;
          line-height: 1.6 !important;
        }
        
        /* Keep citations with their text */
        p > span:last-child {
          white-space: nowrap !important;
        }
        
        /* Better bullet formatting */
        li {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin-bottom: 0.5em !important;
        }
        
        /* Bibliography specific formatting */
        .bibliography li,
        #bibliography li {
          margin-bottom: 0.5em !important;
          padding-right: 0.5in !important;
          font-size: 11pt !important;
        }
        
        /* Keep headings with following content */
        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        
        /* Prevent URL breaking - Enhanced V2 specific */
        a {
          word-break: break-word;
          overflow-wrap: anywhere;
        }
        
        /* Bibliography specific URL handling - force DOIs to stay together */
        .bibliography a, 
        .references a,
        a[href*="doi.org"] {
          display: inline-block;
          white-space: nowrap;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        /* Allow wrapping at slashes for very long URLs */
        .bibliography li,
        .references li {
          word-break: break-word;
          overflow-wrap: anywhere;
          hyphens: none;
        }
        
        /* Ensure DOI spans don't break */
        span[style*="nowrap"] {
          display: inline-block !important;
          white-space: nowrap !important;
        }
        
        @media print { 
          a[href]::after { content: none !important; }
          
          /* Ensure bullets don't break */
          ul, ol {
            page-break-inside: avoid !important;
          }
        }
      `});
      
      // Note: All formatting is now handled in markdown processing before HTML conversion
      try {
        const finalHtml = await page.content();
        const slug = assessmentData.guide_type || assessmentData.guideType || 'unknown';
        await fs.mkdir('debug', { recursive: true });
        const debugPath = `debug/enhanced-${slug}-final.html`;
        await fs.writeFile(debugPath, finalHtml);
        console.log(`[DEBUG] Saved final HTML with DOM glue to ${debugPath}`);
        
        // Also check counts in the final HTML
        const enhBulletCount = (finalHtml.match(/class="enh-bullet"/g) || []).length;
        const citeCount = (finalHtml.match(/class="cite"/g) || []).length;
        const nowrapCount = (finalHtml.match(/class="nowrap"/g) || []).length;
        console.log('[DEBUG] Final HTML counts:', { enhBullets: enhBulletCount, cites: citeCount, nowraps: nowrapCount });
      } catch (e) {
        console.log('[DEBUG] Could not save final HTML:', e);
      }
    }
    
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
        right: '0.75in',  // Balanced margin to prevent cutoff
        bottom: '1in',
        left: '0.75in'   // Balanced margin
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
  tier: 'free' | 'enhanced' | 'monograph',
  options: { enhancedV2Enabled?: boolean } = {}
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
    
    // DEBUG: Check frontmatter title
    console.log('[DEBUG] Original frontmatter title:', frontmatter.title);
    console.log('[DEBUG] Has "Learn About" in title?', frontmatter.title?.includes('Learn About'));
    
    // FIX: Remove "Learn About" from title if present
    if (frontmatter.title && frontmatter.title.includes('Learn About')) {
      frontmatter.title = frontmatter.title.replace('Learn About ', '').replace('Learn About', '').trim();
      console.log('[DEBUG] Fixed frontmatter title:', frontmatter.title);
    }
    
    // FIX: Ensure proper condition name for cover
    if (frontmatter.title === 'Pain Assessment Guide') {
      const conditionMap: Record<string, string> = {
        'sciatica': 'Sciatica',
        'upper_lumbar_radiculopathy': 'Upper Lumbar Radiculopathy',
        'si_joint_dysfunction': 'SI Joint Dysfunction',
        'canal_stenosis': 'Spinal Canal Stenosis',
        'central_disc_bulge': 'Central Disc Bulge',
        'facet_arthropathy': 'Facet Arthropathy',
        'muscular_nslbp': 'Muscular Non-Specific Low Back Pain',
        'lumbar_instability': 'Lumbar Instability',
        'urgent_symptoms': 'Urgent Symptoms'
      };
      const condition = assessmentData.guide_type || assessmentData.guideType || '';
      frontmatter.title = conditionMap[condition] || 'Pain Assessment Guide';
      console.log('[DEBUG] Replaced generic title with:', frontmatter.title);
    }
    
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
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/^END$/gm, '')  // Remove standalone END lines
        .replace(/^DISCLAIMER$/gm, '## Disclaimer');  // Convert DISCLAIMER to heading
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
    
    // Enhanced V2: Clean markdown processing BEFORE image processing
    if (tier === 'enhanced' && options.enhancedV2Enabled) {
      console.log('[ENHANCED-V2] Applying clean markdown processing (generatePdfFromContent)');
      
      // AGGRESSIVE HTML CLEANUP - Remove all br tags before markdown processing
      cleanedContent = cleanedContent.replace(/<br\s*\/?>/gi, ' ');
      cleanedContent = cleanedContent.replace(/&lt;br\s*\/?&gt;/gi, ' ');
      
      // DEBUG: Log what we're working with
      console.log('[TITLE-DEBUG-FROM-CONTENT] guideType:', guideType);
      console.log('[TITLE-DEBUG-FROM-CONTENT] assessmentData.guide_type:', assessmentData.guide_type);
      console.log('[TITLE-DEBUG-FROM-CONTENT] assessmentData.guideType:', assessmentData.guideType);
      
      // Get human-readable condition name
      const conditionNames: Record<string, string> = {
        'si_joint_dysfunction': 'Sacroiliac Joint Pain',
        'sciatica': 'Sciatica',
        'facet_arthropathy': 'Facet Joint Arthropathy',
        'muscular_nslbp': 'Muscular Lower Back Pain',
        'central_disc_bulge': 'Central Disc Bulge',
        'canal_stenosis': 'Spinal Canal Stenosis',
        'lumbar_instability': 'Lumbar Instability',
        'upper_lumbar_radiculopathy': 'Upper Lumbar Radiculopathy',
        'urgent_symptoms': 'Urgent Symptoms'
      };
      
      // Use the proper guide type, not a file path
      const actualCondition = assessmentData.guide_type || assessmentData.guideType || guideType;
      const conditionName = conditionNames[actualCondition] || actualCondition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      console.log('[TITLE-DEBUG-FROM-CONTENT] actualCondition:', actualCondition);
      console.log('[TITLE-DEBUG-FROM-CONTENT] conditionName:', conditionName);
      
      // Fix "Learn About" title to include condition name with proper spacing
      cleanedContent = cleanedContent.replace(/^(#+\s*)?Learn About\s*.*$/m, `\n## Learn About ${conditionName}\n\n`);
      
      // Keep citations attached to their preceding text
      cleanedContent = cleanedContent.replace(/\[([^,]+),\s+(\d{4})\]/g, '[$1,\u00A0$2]');
      cleanedContent = cleanedContent.replace(/\[([A-Z][a-z]+),\s+/g, '[$1,\u00A0');
      cleanedContent = cleanedContent.replace(/(\S+)\s+(\[[^\]]+\])/g, '$1\u00A0$2');
      
      // Shorten DOI URLs
      cleanedContent = cleanedContent.replace(/https:\/\/doi\.org\//g, 'doi.org/');
      
      // Process bibliography section with proper formatting
      const bibliographyRegex = /^(##?\s*(?:Bibliography|References))$([\s\S]*?)$/m;
      cleanedContent = cleanedContent.replace(bibliographyRegex, (match, title, content) => {
        let fixedContent = content;
        
        // Remove https:// prefixes
        fixedContent = fixedContent.replace(/https:\/\//g, '');
        
        // Remove END markers
        fixedContent = fixedContent.replace(/\bEND\b(?!\w)/g, '');
        fixedContent = fixedContent.replace(/^END$/gm, '');
        
        // Split by numbers followed by period and reformat
        const entries = fixedContent.split(/(?=\d+\.)/g)
          .filter(entry => entry.trim())
          .map(entry => {
            // Ensure proper formatting with line break before each entry
            return entry.trim().replace(/^(\d+)\.\s*/, '\n$1. ');
          });
        
        return `${title}\n${entries.join('\n')}`;
      });
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
    let contentAsHtml = await marked.parse(cleanedContent);
    logger.info('HTML conversion complete, length:', contentAsHtml.length);
    
    // Post-HTML cleanup for any remaining artifacts
    if (tier === 'enhanced' && options.enhancedV2Enabled) {
      // Final cleanup of any HTML br tags that might have been generated
      contentAsHtml = contentAsHtml.replace(/<br\s*\/?>/gi, ' ');
      contentAsHtml = contentAsHtml.replace(/&lt;br\s*\/?&gt;/gi, ' ');
    }
    
    // LOG ENHANCED PATH ENTRY (generatePdfFromContent)
    console.log('[ENHANCED-PATH-ENTRY-FROM-CONTENT]', {
      inputTier: tier,
      env: {
        ENHANCED_PARAGRAPH_BULLETS: process.env.ENHANCED_PARAGRAPH_BULLETS,
        ENHANCED_RENDERER: process.env.ENHANCED_RENDERER
      },
      slug: assessmentData?.guide_type || guideType
    });
    
    // LOG PRE-HTML SUMMARY
    console.log('[ENHANCED-PRE-HTML-SUMMARY-FROM-CONTENT]', {
      hasUL: /<ul/i.test(contentAsHtml),
      hasLI: /<li/i.test(contentAsHtml),
      len: contentAsHtml.length
    });
    
    // Enhanced tier optimizations (same as in generatePdfV2)
    if (tier === 'enhanced' && options.enhancedV2Enabled) {
      console.log('Applying Enhanced V2 tier optimizations (from content, flag enabled)...');
      
      // Step 1: Transform lists to hanging-bullet paragraphs
      const transformLists = (html: string): string => {
        // Handle unordered lists
        html = html.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, listContent) => {
          const items = listContent.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (liMatch: string, liContent: string) => {
            const cleanContent = liContent.trim();
            return `<p class="enh-bullet"><span class="dot">•</span><span class="txt">${cleanContent}</span></p>`;
          });
          return items;
        });
        
        // Handle ordered lists
        let olCounter = 1;
        html = html.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, listContent) => {
          olCounter = 1;
          const items = listContent.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (liMatch: string, liContent: string) => {
            const cleanContent = liContent.trim();
            const num = olCounter++;
            return `<p class="enh-bullet"><span class="dot">${num}.</span><span class="txt">${cleanContent}</span></p>`;
          });
          return items;
        });
        
        return html;
      };
      
      contentAsHtml = transformLists(contentAsHtml);
      
      // LOG AFTER LIST TRANSFORM
      console.log('[ENHANCED-LIST-TRANSFORM]', {
        enhBullets: (contentAsHtml.match(/class="enh-bullet"/g) || []).length,
        remainingLI: (contentAsHtml.match(/<li/gi) || []).length
      });
      
      // Step 2: Wrap citations with preceding word
      contentAsHtml = contentAsHtml.replace(
        /(\b[^\s<]+)\s+(\[[^\]]+\])/g,
        '<span class="nowrap">$1 $2</span>'
      );
      
      // Step 3: Protect problematic phrases
      const problemPhrases = [
        'reduce discomfort',
        'checking spine mobility',
        'with light movement',
        'spine mobility',
        'lumbar support',
        'gentle walking',
        'conservative care',
        'medical guidelines',
        'physical exam',
        'medical history',
        'facet arthropathy',
        'cauda equina'
      ];
      
      problemPhrases.forEach(phrase => {
        const regex = new RegExp(`\\b(${phrase})\\b`, 'gi');
        contentAsHtml = contentAsHtml.replace(
          regex,
          '<span class="nowrap">$1</span>'
        );
      });
      
      // Step 4: Protect parenthetical expressions
      contentAsHtml = contentAsHtml.replace(
        /\(e\.g\.[^)]{1,40}\)/g,
        (match: string) => `<span class="nowrap">${match}</span>`
      );
      
      // Step 5: Keep numbers with their units
      contentAsHtml = contentAsHtml.replace(/(\d+)\s+(weeks?|months?|years?|days?|hours?|minutes?)/gi, '$1&nbsp;$2');
      contentAsHtml = contentAsHtml.replace(/(\d+)\s*–\s*(\d+)/g, '$1–$2');
      contentAsHtml = contentAsHtml.replace(/(\d+)%/g, '$1%');
    }
    
    // 5. Pass frontmatter to template
    logger.info('Generating HTML template...');
    let fullHtml = getPdfHtmlTemplate(contentAsHtml, assessmentData, tier, frontmatter);
    logger.info('HTML template generated, length:', fullHtml.length);
    
    // No special processing needed - clean HTML generation
    
    // DEBUG: Save HTML for comparison
    if (tier === 'enhanced' && options.enhancedV2Enabled) {
      try {
        const debugPath = `debug-${assessmentData.guide_type}-enhanced-v2.html`;
        await fs.writeFile(debugPath, fullHtml);
        console.log(`[DEBUG] Saved HTML to ${debugPath}`);
      } catch (e) {
        console.log('[DEBUG] Could not save HTML:', e);
      }
    }
    
    // 6. Launch Puppeteer and generate PDF
    console.info('Step 1: Getting browser from pool...');
    browser = await getBrowser();
    logger.info('Browser instance obtained from pool');
    
    page = await browser.newPage();
    await configurePage(page);
    
    // Pipe browser console to Node console
    page.on('console', msg => console.log('[PAGE]', msg.text()));
    
    // Set viewport to match US Letter size properly (not A4!)
    await page.setViewport({ 
      width: 816,  // 8.5 inches * 96 DPI
      height: 1056, // 11 inches * 96 DPI
      deviceScaleFactor: 1 
    });
    console.info('Step 3: New page opened with US Letter viewport. Setting content...');
    console.log('[WIDTH-DEBUG] Page viewport:', await page.viewport());
    
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
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    console.info('Step 5: Content set. Checking dimensions...');
    
    // Check actual dimensions for overflow
    const dimensions = await page.evaluate(() => {
      return {
        bodyWidth: document.body.scrollWidth,
        bodyHeight: document.body.scrollHeight,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        overflow: document.body.scrollWidth > window.innerWidth
      };
    });
    console.log('[WIDTH-DEBUG] Actual dimensions:', dimensions);
    if (dimensions.overflow) {
      console.warn('[WARNING] Content is overflowing the page width!');
    }
    
    console.log('[PDF] Content set successfully');
    logger.info('Page content set');
    
    // Enhanced V2: Clean markdown processing approach (DOM manipulation disabled)
    if (tier === 'enhanced' && options.enhancedV2Enabled) {
      console.log('[ENHANCED-V2] Using clean markdown processing - DOM manipulation disabled');
      
      // Add clean print styles and prevent awkward breaks
      await page.addStyleTag({ content: `
        /* Enhanced V2 Typography - Optimized for readability */
        body {
          font-size: 11pt !important;  /* Slightly smaller to fit better */
          line-height: 1.5 !important;
          padding: 0;
          margin: 0;
          width: 100%;
          box-sizing: border-box;
        }
        
        /* Content width constraints */
        .content, p, li, div {
          max-width: 7in !important;  /* Full usable width (8.5 - 0.75 - 0.75) */
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          hyphens: auto !important;  /* Allow hyphenation when needed */
        }
        
        h2 { 
          font-size: 16pt !important;
          margin-top: 1.5em !important;
        }
        
        h3 { 
          font-size: 14pt !important;
          margin-top: 1.2em !important;
        }
        
        /* Prevent awkward line breaks */
        p, li {
          hyphens: none !important;
          word-break: normal !important;
          overflow-wrap: normal !important;
          line-height: 1.6 !important;
        }
        
        /* Keep citations with their text */
        p > span:last-child {
          white-space: nowrap !important;
        }
        
        /* Better bullet formatting */
        li {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin-bottom: 0.5em !important;
        }
        
        /* Bibliography specific formatting */
        .bibliography li,
        #bibliography li {
          margin-bottom: 0.5em !important;
          padding-right: 0.5in !important;
          font-size: 11pt !important;
        }
        
        /* Keep headings with following content */
        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        
        /* Prevent URL breaking - Enhanced V2 specific */
        a {
          word-break: break-word;
          overflow-wrap: anywhere;
        }
        
        /* Bibliography specific URL handling - force DOIs to stay together */
        .bibliography a, 
        .references a,
        a[href*="doi.org"] {
          display: inline-block;
          white-space: nowrap;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        /* Allow wrapping at slashes for very long URLs */
        .bibliography li,
        .references li {
          word-break: break-word;
          overflow-wrap: anywhere;
          hyphens: none;
        }
        
        /* Ensure DOI spans don't break */
        span[style*="nowrap"] {
          display: inline-block !important;
          white-space: nowrap !important;
        }
        
        @media print { 
          a[href]::after { content: none !important; }
          
          /* Ensure bullets don't break */
          ul, ol {
            page-break-inside: avoid !important;
          }
        }
      `});
      
      // Note: All formatting is now handled in markdown processing before HTML conversion
      try {
        const finalHtml = await page.content();
        const slug = assessmentData.guide_type || assessmentData.guideType || 'unknown';
        await fs.mkdir('debug', { recursive: true });
        const debugPath = `debug/enhanced-${slug}-final.html`;
        await fs.writeFile(debugPath, finalHtml);
        console.log(`[DEBUG] Saved final HTML with DOM glue to ${debugPath}`);
        
        // Also check counts in the final HTML
        const enhBulletCount = (finalHtml.match(/class="enh-bullet"/g) || []).length;
        const citeCount = (finalHtml.match(/class="cite"/g) || []).length;
        const nowrapCount = (finalHtml.match(/class="nowrap"/g) || []).length;
        console.log('[DEBUG] Final HTML counts:', { enhBullets: enhBulletCount, cites: citeCount, nowraps: nowrapCount });
      } catch (e) {
        console.log('[DEBUG] Could not save final HTML:', e);
      }
    }
    
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
        right: '0.75in',  // Balanced margin to prevent cutoff
        bottom: '1in',
        left: '0.75in'   // Balanced margin
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
