import * as cheerio from 'cheerio';

/**
 * Normalize Enhanced bibliography to fix fused entries
 * This is a minimal fix that ONLY handles bibliography formatting
 */
export function normalizeEnhancedBibliography(html: string): string {
  try {
    const $ = cheerio.load(html);
    
    // Find bibliography heading
    const bibH = $('h2, h3').filter((_, el) => {
      const txt = $(el).text();
      return /bibliography|references/i.test(txt);
    });
    
    if (!bibH.length) {
      console.log('[BIB-NORMALIZE] No bibliography heading found');
      return html;
    }
    
    // Check if already formatted as <ol>
    const next = bibH.next();
    if (next.is('ol')) {
      console.log('[BIB-NORMALIZE] Already formatted as ordered list');
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
        $li.find('p').each((__, p) => {
          $(p).replaceWith($(p).contents());
        });
        
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
    
    // If not already an <ol>, collect and rebuild
    console.log('[BIB-NORMALIZE] Collecting bibliography content');
    const collected: any[] = [];
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
        .replace(/(\d+)\s*[-–—]\s*(\d+)/g, '<span class="norun">$1&#8209;$2</span>')
        .replace(/\s*\[DOI\]\s*/g, ' [DOI]')
        .replace(/\s{2,}/g, ' ')
        .trim();
      
      if (!/[.?!]\s*$/.test(cleaned)) cleaned += '.';
      $ol.append(`<li>${cleaned}</li>`);
    }
    
    // Insert after heading
    bibH.after($ol);
    
    return $.html();
  } catch (error) {
    console.error('[BIB-NORMALIZE] Error:', error);
    return html;
  }
}