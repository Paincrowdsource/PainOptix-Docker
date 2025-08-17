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
import { enhancedDomGlueShipScript } from './enhanced-dom-glue-ship';
import * as cheerio from 'cheerio';

// Configure marked to handle our markdown properly
// NOTE: breaks:false for Enhanced tier to prevent <br> tags in bibliography
marked.setOptions({
  breaks: false, // CRITICAL: Disable <br> on single newlines for Enhanced
  gfm: true
});
console.log('[ENHANCED-MD] marked configured with breaks=false to prevent <br> tags');

// Function to normalize Enhanced bibliography - robust version that rebuilds structure
function normalizeEnhancedBibliography(html: string): string {
  try {
    const $ = cheerio.load(html, { decodeEntities: false });

    // Find "Bibliography" or "References" at any heading level
    const bibH = $('h1,h2,h3,h4,h5,h6')
      .filter((_, el) => /^(bibliography|references)$/i.test($(el).text().trim()))
      .first();
    if (!bibH.length) {
      console.log('[BIB-NORMALIZE] No bibliography heading found');
      return html;
    }

    // If already an <ol>, split any multi-entry items
    const next = bibH.next();
    if (next.is('ol')) {
      console.log('[BIB-NORMALIZE] Found existing <ol>, splitting multi-entry items');
      next.addClass('bibliography');
      
      // Helper: split text containing multiple citations
      const splitIntoEntries = (s: string): string[] => {
        let t = s
          .replace(/\[\[DOI\|[^\]]+\]\]/gi, '[DOI]')
          .replace(/\[DOI\|[^\]]+\]/gi, '[DOI]')
          .replace(/\s*\[\s*DOI\s*\]\s*/gi, ' [DOI]')
          .replace(/\s{2,}/g, ' ')
          .trim();
        
        // Split after year pattern like "(1983)." or "(2020)."
        const byYear = t.split(
          /(?<=\(\d{4}[a-z]?\)\.?)\s+(?=[A-Z][A-Za-z''`\-]+,\s*[A-Z])/g
        );
        
        // Also split after [DOI] when followed by new author
        const out: string[] = [];
        byYear.forEach(chunk => {
          const parts = chunk.split(
            /(?<=\[DOI\]\.?)\s+(?=[A-Z][A-Za-z''`\-]+,\s*[A-Z])/g
          );
          out.push(...parts);
        });
        
        // Clean up numbering if present
        return out
          .map(x => x.replace(/^\s*\d+\.\s*/, '').trim())
          .filter(x => x.length > 20); // Must be substantial
      };
      
      // Format one entry properly
      const formatEntry = (txt: string): string => {
        let clean = txt
          .replace(/(\d+)\s*[-–—]\s*(\d+)/g, '<span class="norun">$1&#8209;$2</span>')
          .replace(/\s*\[DOI\]\s*/g, ' [DOI]')
          .replace(/\s{2,}/g, ' ')
          .trim();
        // Add period if missing
        if (!/[.?!]\s*$/.test(clean)) clean += '.';
        return clean;
      };
      
      // Process each li - split if contains multiple entries
      const newItems: string[] = [];
      next.find('li').each((_, li) => {
        const $li = $(li);
        $li.find('p').each((__, p) => $(p).replaceWith($(p).contents()));
        
        const raw = $li.text();
        const parts = splitIntoEntries(raw);
        
        // Each part becomes its own entry
        parts.forEach(part => {
          if (part.trim()) {
            newItems.push(formatEntry(part));
          }
        });
      });
      
      // Rebuild the list with separated entries
      next.empty();
      newItems.forEach(item => {
        next.append(`<li>${item}</li>`);
      });
      
      console.log('[BIB-NORMALIZE] Split into', newItems.length, 'separate entries');
      return $.html();
    }

    // Collect everything until next heading
    console.log('[BIB-NORMALIZE] Collecting bibliography content');
    const collected: cheerio.Cheerio[] = [];
    let n = bibH.next();
    while (n.length && !/^h[1-6]$/i.test(n[0].tagName || '')) {
      collected.push(n);
      n = n.next();
    }

    // Convert to plain text
    const raw = collected.map(node => $.html(node)).join('\n');
    let text = raw
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\[\[DOI\|[^\]]+\]\]/gi, '[DOI]')
      .replace(/\[DOI\|[^\]]+\]/gi, '[DOI]')
      .replace(/\s+/g, ' ')
      .trim();

    console.log('[BIB-NORMALIZE] Raw text length:', text.length);

    // Extract entries using ALL strategies combined
    const entries: string[] = [];

    // First split by YEAR pattern (strongest boundary)
    const yearSplit = text.split(
      /(?<=\(\d{4}[a-z]?\)\.?)\s+(?=[A-Z][A-Za-z''`\-]+,\s*[A-Z])/g
    );
    
    console.log('[BIB-NORMALIZE] Year split found', yearSplit.length, 'chunks');

    yearSplit.forEach(chunk => {
      // Within each year-split chunk, check for numbered entries
      const numbered = chunk.match(/\d+\.\s+[A-Z][^]*?(?=\d+\.\s|$)/g);
      if (numbered && numbered.length > 0) {
        numbered.forEach(e => {
          const cleaned = e.replace(/^\s*\d+\.\s*/, '').trim();
          if (cleaned.length > 20) entries.push(cleaned);
        });
      } else {
        // No numbers, check if this chunk can be split after [DOI]
        const doiSplit = chunk.split(/(?<=\[DOI\]\.?)\s+(?=[A-Z][A-Za-z''`\-]+,\s*[A-Z])/g);
        if (doiSplit.length > 1) {
          doiSplit.forEach(e => {
            const cleaned = e.trim();
            if (cleaned.length > 20) entries.push(cleaned);
          });
        } else {
          // Use the whole chunk if it's substantial
          const cleaned = chunk.trim();
          if (cleaned.length > 20) entries.push(cleaned);
        }
      }
    });
    
    console.log('[BIB-NORMALIZE] Total entries extracted:', entries.length);

    if (!entries.length) {
      console.log('[BIB-NORMALIZE] No entries found, returning original');
      return html;
    }

    // Remove old content
    collected.forEach(el => el.remove());

    // Build proper list
    const $ol = $('<ol class="bibliography"></ol>');
    for (const e of entries) {
      let cleaned = e
        .replace(/^\s*\d+\.\s*/, '')
        .replace(/(\d+)\s*[-–—]\s*(\d+)/g, '<span class="norun">$1&#8209;$2</span>')
        .replace(/\s*\[DOI\]\s*/g, ' [DOI]')
        .replace(/\s{2,}/g, ' ')
        .trim();
      if (!/[.?!]\s*$/.test(cleaned)) cleaned += '.';
      $ol.append(`<li>${cleaned}</li>`);
    }
    
    // Insert the new list after the heading
    bibH.after($ol);
    console.log('[BIB-NORMALIZE] Created <ol> with', entries.length, 'entries');
    return $.html();
    
  } catch (e) {
    console.error('[BIB-NORMALIZE] Error:', e);
    return html; // Return original on error
  }
}

// Final cleanup function to remove ALL sentinels
function finalDeSentinelize(html: string): string {
  // NUCLEAR OPTION - remove ALL sentinels right before PDF generation
  // This is the last line of defense against sentinels appearing in PDFs
  return html
    // Remove complete DOI sentinels
    .replace(/\[\[DOI\|[^\]]+\]\]/gi, '[DOI]')
    // Remove partial DOI sentinels (missing closing brackets)
    .replace(/\[\[DOI\|[^\]]+\]/gi, '[DOI]')
    .replace(/\[DOI\|[^\]]+\]\]/gi, '[DOI]')
    .replace(/\[DOI\|[^\]]+\]/gi, '[DOI]')
    // Remove complete RANGE sentinels
    .replace(/\[\[RANGE\|(\d+)-(\d+)\]\]/gi, '$1-$2')
    // Remove partial RANGE sentinels (missing brackets)
    .replace(/\[\[RANGE\|(\d+)-(\d+)\]/gi, '$1-$2')
    .replace(/\[RANGE\|(\d+)-(\d+)\]\]/gi, '$1-$2')
    .replace(/\[RANGE\|(\d+)-(\d+)\]/gi, '$1-$2')
    // Clean up any stray sentinel markers
    .replace(/\[\[DOI\|/gi, '[DOI]')
    .replace(/\[DOI\|/gi, '[DOI]')
    .replace(/\[\[RANGE\|/gi, '')
    .replace(/\[RANGE\|/gi, '')
    // Final cleanup of any remaining brackets
    .replace(/\[\[/g, '')
    .replace(/\]\]/g, '');
}

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
    
    // Add defensive tokenization BEFORE marked.parse() for Enhanced tier
    if (tier === 'enhanced') {
      console.error('[SENTINEL-DEBUG-1] About to parse markdown, tier:', tier);
      // Ensure sentinels are present (defensive in case markdown wasn't pre-processed)
      const bibIndex = cleanedContent.indexOf('## Bibliography');
      if (bibIndex !== -1) {
        console.log('[BIBLIOGRAPHY] Applying defensive sentinel tokenization...');
        const beforeBib = cleanedContent.substring(0, bibIndex);
        let bibSection = cleanedContent.substring(bibIndex);
        
        // Apply sentinel tokenization (defensive - may already be done)
        if (!bibSection.includes('[[DOI|')) {
          bibSection = bibSection.replace(
            /DOI:\s*(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/gi,
            (_match, doi) => `[[DOI|${doi}]]`
          );
        }
        
        if (!bibSection.includes('[[RANGE|')) {
          bibSection = bibSection.replace(
            /(\d+)\s*[-–—]\s*(\d+)(?!\d)/g,
            (_match, start, end) => `[[RANGE|${start}-${end}]]`
          );
        }
        
        cleanedContent = beforeBib + bibSection;
        console.error('[SENTINEL-DEBUG-2] Content has sentinels?', cleanedContent.includes('[[DOI'));
      }
    }
    
    // 4. Convert to HTML
    let contentAsHtml = await marked.parse(cleanedContent);
    console.error('[SENTINEL-DEBUG-3] After marked, HTML has sentinels?', contentAsHtml.includes('[[DOI'));
    console.error('[SENTINEL-DEBUG-3b] HTML has encoded sentinels?', contentAsHtml.includes('&#91;'));
    console.log('HTML contains img tags?', contentAsHtml.includes('<img'));
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
      
      // contentAsHtml = transformLists(contentAsHtml);  // DISABLED - breaks bullet formatting
      
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
        (match) => `<span class="nowrap">${match}</span>`
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
      
      // Step 7: Normalize bibliography for Enhanced tier - simplified
      console.log('[BIBLIOGRAPHY] Removing sentinels...');
      contentAsHtml = normalizeEnhancedBibliography(contentAsHtml);
      console.log('[BIBLIOGRAPHY] Sentinels removed');
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
    if ((tier === 'enhanced' && options.enhancedV2Enabled) || process.env.DEBUG_PDF === '1') {
      try {
        const debugPath = tier === 'enhanced' 
          ? `debug-enhanced-${assessmentData.guide_type || 'unknown'}.html`
          : `debug-${tier}-${assessmentData.guide_type || 'unknown'}.html`;
        await fs.writeFile(debugPath, fullHtml);
        console.log(`[DEBUG] Saved HTML to ${debugPath} for inspection`);
        
        // Log specific debug info for bibliography
        if (tier === 'enhanced') {
          // Verify bibliography structure
          const bibBlock = fullHtml.match(/<h2[^>]*>\s*Bibliography\s*<\/h2>[\s\S]*?(?=<h2|<\/body>)/i)?.[0] || '';
          console.log('[BIB-DEBUG] has <ol class="bibliography">', /<ol[^>]*\bbibliography\b/.test(bibBlock));
          console.log('[BIB-DEBUG] DOI spans count:', (bibBlock.match(/class="doi"/g) || []).length);
          console.log('[BIB-DEBUG] Non-breaking hyphens:', (bibBlock.match(/&#8209;/g) || []).length);
          console.log('[BIB-DEBUG] Has <p> inside <li>:', /<li[^>]*>[\s\S]*?<p/i.test(bibBlock));
          
          // Check for problematic CSS
          if (fullHtml.includes('overflow-wrap:anywhere') || fullHtml.includes('overflow-wrap: anywhere')) {
            console.warn('[BIB-DEBUG] WARNING: Found overflow-wrap:anywhere which will break DOIs!');
          }
        }
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
    
    // Set explicit viewport for consistent rendering across all tiers
    // Use EXTRA wide viewport to prevent text wrapping issues
    await page.setViewport({ width: 2400, height: 3400 }); // Extra wide viewport to prevent citation breaks
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
    
    // FINAL CLEANUP - Remove any sentinels that survived (Enhanced V2 only)
    if (tier === 'enhanced' && options.enhancedV2Enabled) {
      console.log('[FINAL-DESENTINEL] Removing any remaining sentinels before PDF generation...');
      fullHtml = finalDeSentinelize(fullHtml);
      
      // Add guard to FAIL FAST if sentinels remain
      if (fullHtml.includes('[[DOI') || fullHtml.includes('[[RANGE')) {
        console.error('CRITICAL: Sentinels still present in final HTML!');
        // Log the specific sentinels found
        const doiSentinels = (fullHtml.match(/\[\[DOI[^\]]*\]\]/g) || []).slice(0, 3);
        const rangeSentinels = (fullHtml.match(/\[\[RANGE[^\]]*\]\]/g) || []).slice(0, 3);
        console.error('Found DOI sentinels:', doiSentinels);
        console.error('Found RANGE sentinels:', rangeSentinels);
        throw new Error('SENTINELS_STILL_PRESENT_IN_FINAL_HTML');
      }
      console.log('[FINAL-DESENTINEL] All sentinels removed successfully');
    }
    
    await page.setContent(fullHtml, { 
      waitUntil: 'networkidle0', // Try 'domcontentloaded' if images cause hanging
      timeout: 30000 
    });
    console.info('Step 5: Content set. Generating PDF...');
    console.log('[PDF] Content set successfully');
    logger.info('Page content set');
    
    // DOM-aware glue for Enhanced tier to prevent citation/phrase orphaning
    if (tier === 'enhanced' && options.enhancedV2Enabled) {
      console.log('[ENHANCED-DOM-GLUE] Starting DOM-aware glue...');
      
      // First inject styles
      await page.addStyleTag({ content: `
        .nowrap { white-space: nowrap; }
        .cite { display: inline-block; }
        .glue { display: inline-block; }
        .bib { margin-top: 6pt; }
        .bib-item { 
          margin: 6pt 0; 
          line-height: 1.35; 
          page-break-inside: avoid; 
          break-inside: avoid; 
        }
        @media print { 
          a[href]::after { content: none !important; } 
        }
      `});
      
      // Execute the enhanced DOM glue script
      await page.evaluate(enhancedDomGlueShipScript);
      console.log('[ENHANCED-DOM-GLUE] DOM-aware glue applied');
      
      // Inject the print CSS LAST to ensure it overrides everything
      await page.addStyleTag({ content: '@media print{a[href]::after{content:none!important}}' });
      console.log('[ENHANCED-DOM-GLUE] Injected final print CSS to stop DOI duplication');
      
      // Save the final HTML after all transformations for debugging
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
        right: '0.4in',  // Further reduced for maximum text width
        bottom: '1in',
        left: '0.4in'    // Further reduced for maximum text width
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
    let contentAsHtml = await marked.parse(cleanedContent);
    logger.info('HTML conversion complete, length:', contentAsHtml.length);
    
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
      
      // contentAsHtml = transformLists(contentAsHtml);  // DISABLED - breaks bullet formatting
      
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
        (match) => `<span class="nowrap">${match}</span>`
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
    if ((tier === 'enhanced' && options.enhancedV2Enabled) || process.env.DEBUG_PDF === '1') {
      try {
        const debugPath = tier === 'enhanced' 
          ? `debug-enhanced-${assessmentData.guide_type || 'unknown'}.html`
          : `debug-${tier}-${assessmentData.guide_type || 'unknown'}.html`;
        await fs.writeFile(debugPath, fullHtml);
        console.log(`[DEBUG] Saved HTML to ${debugPath} for inspection`);
        
        // Log specific debug info for bibliography
        if (tier === 'enhanced') {
          // Verify bibliography structure
          const bibBlock = fullHtml.match(/<h2[^>]*>\s*Bibliography\s*<\/h2>[\s\S]*?(?=<h2|<\/body>)/i)?.[0] || '';
          console.log('[BIB-DEBUG] has <ol class="bibliography">', /<ol[^>]*\bbibliography\b/.test(bibBlock));
          console.log('[BIB-DEBUG] DOI spans count:', (bibBlock.match(/class="doi"/g) || []).length);
          console.log('[BIB-DEBUG] Non-breaking hyphens:', (bibBlock.match(/&#8209;/g) || []).length);
          console.log('[BIB-DEBUG] Has <p> inside <li>:', /<li[^>]*>[\s\S]*?<p/i.test(bibBlock));
          
          // Check for problematic CSS
          if (fullHtml.includes('overflow-wrap:anywhere') || fullHtml.includes('overflow-wrap: anywhere')) {
            console.warn('[BIB-DEBUG] WARNING: Found overflow-wrap:anywhere which will break DOIs!');
          }
        }
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
    
    // Set explicit viewport for consistent rendering across all tiers
    // Use EXTRA wide viewport to prevent text wrapping issues
    await page.setViewport({ width: 2400, height: 3400 }); // Extra wide viewport to prevent citation breaks
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
    
    // FINAL CLEANUP - Remove any sentinels that survived (Enhanced V2 only)
    if (tier === 'enhanced' && options.enhancedV2Enabled) {
      console.log('[FINAL-DESENTINEL] Removing any remaining sentinels before PDF generation...');
      fullHtml = finalDeSentinelize(fullHtml);
      
      // Add guard to FAIL FAST if sentinels remain
      if (fullHtml.includes('[[DOI') || fullHtml.includes('[[RANGE')) {
        console.error('CRITICAL: Sentinels still present in final HTML!');
        // Log the specific sentinels found
        const doiSentinels = (fullHtml.match(/\[\[DOI[^\]]*\]\]/g) || []).slice(0, 3);
        const rangeSentinels = (fullHtml.match(/\[\[RANGE[^\]]*\]\]/g) || []).slice(0, 3);
        console.error('Found DOI sentinels:', doiSentinels);
        console.error('Found RANGE sentinels:', rangeSentinels);
        throw new Error('SENTINELS_STILL_PRESENT_IN_FINAL_HTML');
      }
      console.log('[FINAL-DESENTINEL] All sentinels removed successfully');
    }
    
    await page.setContent(fullHtml, { 
      waitUntil: 'networkidle0', // Try 'domcontentloaded' if images cause hanging
      timeout: 30000 
    });
    console.info('Step 5: Content set. Generating PDF...');
    console.log('[PDF] Content set successfully');
    logger.info('Page content set');
    
    // DOM-aware glue for Enhanced tier to prevent citation/phrase orphaning
    if (tier === 'enhanced' && options.enhancedV2Enabled) {
      console.log('[ENHANCED-DOM-GLUE] Starting DOM-aware glue...');
      
      // First inject styles
      await page.addStyleTag({ content: `
        .nowrap { white-space: nowrap; }
        .cite { display: inline-block; }
        .glue { display: inline-block; }
        .bib { margin-top: 6pt; }
        .bib-item { 
          margin: 6pt 0; 
          line-height: 1.35; 
          page-break-inside: avoid; 
          break-inside: avoid; 
        }
        @media print { 
          a[href]::after { content: none !important; } 
        }
      `});
      
      // Execute the enhanced DOM glue script
      await page.evaluate(enhancedDomGlueShipScript);
      console.log('[ENHANCED-DOM-GLUE] DOM-aware glue applied');
      
      // Inject the print CSS LAST to ensure it overrides everything
      await page.addStyleTag({ content: '@media print{a[href]::after{content:none!important}}' });
      console.log('[ENHANCED-DOM-GLUE] Injected final print CSS to stop DOI duplication');
      
      // Save the final HTML after all transformations for debugging
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
        right: '0.4in',  // Further reduced for maximum text width
        bottom: '1in',
        left: '0.4in'    // Further reduced for maximum text width
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
