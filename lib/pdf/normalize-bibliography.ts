import * as cheerio from 'cheerio';

export function normalizeEnhancedBibliography(html: string): string {
  try {
    const $ = cheerio.load(html);

    // Find "Bibliography" / "References"
    const bibH = $('h1,h2,h3,h4,h5,h6')
      .filter((_, el) => /^(bibliography|references)$/i.test($(el).text().trim()))
      .first();
    if (!bibH.length) return html;

    // If an ordered list already exists, split any fused items and clean
    const next = bibH.next();
    if (next.is('ol')) {
      next.addClass('bibliography');

      const splitIntoEntries = (s: string): string[] => {
        let t = s
          .replace(/\s+/g, ' ')
          .replace(/\[\[DOI\|[^\]]+\]\]/gi, '[DOI]')
          .replace(/\[DOI\|[^\]]+\]/gi, '[DOI]')
          .trim();

        // Split after year like "(2007). " followed by a capital (start of new author)
        const byYear = t.split(/(?<=\(\d{4}[a-z]?\)\.)\s+(?=[A-Z])/g);

        // Then further split after [DOI] when a new author follows
        const out: string[] = [];
        byYear.forEach(chunk => {
          const parts = chunk.split(/(?<=\[DOI\]\.?)\s+(?=[A-Z][A-Za-z'`\-]+,\s*[A-Z])/g);
          out.push(...parts);
        });

        // Fallbacks if nothing split
        let items = out.length ? out : [t];
        if (items.length === 1) {
          // Try numbered "1. … 2. …"
          const numbered = t.match(/\d+\.\s+[\s\S]*?(?=\s*\d+\.\s|$)/g);
          if (numbered) items = numbered.map(x => x.replace(/^\d+\.\s*/, '').trim());
        }
        if (items.length === 1) {
          // Try author boundary
          items = t.split(/(?=[A-Z][a-z]+,\s*[A-Z]\.)/g).map(x => x.trim());
        }
        return items.filter(x => x.length > 30);
      };

      const collected: string[] = [];
      next.find('li').each((_, li) => {
        const text = $(li).text().replace(/\u00A0/g, ' ');
        collected.push(...splitIntoEntries(text));
      });

      next.empty();
      collected.forEach(e => {
        let clean = e
          .replace(/(\d+)\s*[-–—]\s*(\d+)/g, '<span class="norun">$1&#8209;$2</span>')
          .replace(/\s*\[DOI\]\s*/g, ' [DOI]')
          .replace(/\s{2,}/g, ' ')
          .trim();
        if (!/[.?!]$/.test(clean)) clean += '.';
        next.append(`<li>${clean}</li>`);
      });

      return $.html();
    }

    // Collect everything until next heading and rebuild fresh
    const block: cheerio.Cheerio<cheerio.Element>[] = [];
    let cur = bibH.next();
    while (cur.length && !/^h[1-6]$/i.test(cur[0]?.tagName || '')) {
      block.push(cur);
      cur = cur.next();
    }
    if (!block.length) return html;

    const raw = block.map(n => $(n).text().replace(/\u00A0/g, ' ')).join(' ')
      .replace(/\s+/g, ' ')
      .replace(/\[\[DOI\|[^\]]+\]\]/gi, '[DOI]')
      .replace(/\[DOI\|[^\]]+\]/gi, '[DOI]')
      .trim();

    // Primary split: year boundary
    const entries: string[] = [];
    const yearChunks = raw.split(/(?<=\(\d{4}[a-z]?\)\.)\s+(?=[A-Z])/g);

    const add = (txt: string) => {
      const v = txt.trim();
      if (v.length > 30) entries.push(v);
    };

    if (yearChunks.length > 1) {
      yearChunks.forEach(add);
    } else {
      const numbered = raw.match(/\d+\.\s+[\s\S]*?(?=\s*\d+\.\s|$)/g);
      if (numbered) numbered.forEach(m => add(m.replace(/^\d+\.\s*/, '')));
    }
    if (!entries.length) {
      raw.split(/(?=[A-Z][a-z]+,\s*[A-Z]\.)/g).forEach(add);
    }
    if (!entries.length) return html;

    block.forEach(n => n.remove());

    const $ol = $('<ol class="bibliography"></ol>');
    entries.forEach(e => {
      let clean = e
        .replace(/(\d+)\s*[-–—]\s*(\d+)/g, '<span class="norun">$1&#8209;$2</span>')
        .replace(/\s*\[DOI\]\s*/g, ' [DOI]')
        .replace(/\s{2,}/g, ' ')
        .trim();
      if (!/[.?!]$/.test(clean)) clean += '.';
      $ol.append(`<li>${clean}</li>`);
    });

    bibH.after($ol);
    return $.html();
  } catch {
    return html;
  }
}