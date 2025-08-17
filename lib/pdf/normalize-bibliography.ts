// docker-repo/lib/pdf/normalize-bibliography.ts
import * as cheerio from 'cheerio';

const LOG = (...a: any[]) => console.error('[BIB-NORMALIZE]', ...a);

// Split rules used everywhere
function splitIntoEntries(raw: string): string[] {
  if (!raw) return [];
  let t = raw
    .replace(/\u00A0/g, ' ')       // NBSP -> space
    .replace(/\s+/g, ' ')
    .replace(/\[\[DOI\|[^\]]+\]\]/gi, '[DOI]')
    .replace(/\[DOI\|[^\]]+\]/gi, '[DOI]')
    .trim();

  const out: string[] = [];

  // STRONGEST: split on "(YYYY)." followed by start of a new author (Capital letter)
  // Note: this works for 1983, 2020, and 2020a etc.
  let parts = t.split(/(?<=\(\d{4}[a-z]?\)\.)\s+(?=[A-Z])/g);
  if (parts.length > 1) out.push(...parts);

  // If still fused, split on "[DOI]. " when followed by a new author pattern "Surname, I."
  if (!out.length) {
    parts = t.split(/(?<=\[DOI\]\.?)\s+(?=[A-Z][A-Za-z'`\-]+,\s*[A-Z]\.)/g);
    if (parts.length > 1) out.push(...parts);
  }

  // Classic numbered list fallback: "1. … 2. …"
  if (!out.length) {
    const numbered = t.match(/\d+\.\s+[\s\S]*?(?=\s*\d+\.\s|$)/g);
    if (numbered) out.push(...numbered.map(s => s.replace(/^\d+\.\s*/, '').trim()));
  }

  // Author boundary fallback
  if (!out.length) {
    parts = t.split(/(?=[A-Z][a-z]+,\s*[A-Z]\.)/g);
    if (parts.length > 1) out.push(...parts);
  }

  // If still nothing, return the whole thing
  if (!out.length) out.push(t);

  // Weed out tiny fragments
  return out.map(s => s.trim()).filter(s => s.length > 30);
}

export function normalizeEnhancedBibliography(html: string): string {
  LOG('function called; input length=', html?.length || 0);
  try {
    const $ = cheerio.load(html); // no decodeEntities to avoid type/compat headaches

    // Find "Bibliography"/"References" as: h1–h6, OR <p><strong|b>Bibliography</strong|b></p>, OR plain <p>Bibliography</p>
    const isTitle = (txt: string) => /^\s*(bibliography|references)\s*$/i.test(txt || '');
    let bib = $('h1,h2,h3,h4,h5,h6,p').filter((_, el) => {
      const node = $(el);
      const text = node.text().trim();
      if (isTitle(text)) return true;
      const strong = node.children('strong,b').first();
      if (strong.length && isTitle(strong.text().trim())) return true;
      return false;
    }).first();

    LOG('heading found?', !!bib.length, 'tag=', bib[0]?.tagName, 'text=', bib.text().trim());

    if (!bib.length) {
      LOG('NO heading; returning original');
      return html;
    }

    // Case A: already an <ol> after the heading → split any fused <li>s
    const next = bib.next();
    if (next.is('ol')) {
      LOG('found existing <ol>, splitting any fused <li> entries');
      const rebuilt: string[] = [];
      next.find('li').each((_, li) => {
        const txt = $(li).text().replace(/\u00A0/g, ' ');
        rebuilt.push(...splitIntoEntries(txt));
      });

      next.empty();
      rebuilt.forEach(e => {
        let clean = e
          .replace(/(\d+)\s*[-–—]\s*(\d+)/g, '<span class="norun">$1&#8209;$2</span>')
          .replace(/\s*\[DOI\]\s*/g, ' [DOI]')
          .replace(/\s{2,}/g, ' ')
          .trim();
        if (!/[.?!]$/.test(clean)) clean += '.';
        next.append(`<li>${clean}</li>`);
      });

      LOG('rebuilt <ol> count=', rebuilt.length);
      return $.html();
    }

    // Case B: not an <ol> → collect nodes until next heading and rebuild from plain text
    LOG('no <ol> found; rebuilding from text between heading and next heading');
    const block: any[] = [];
    let cur = bib.next();
    while (cur.length && !/^h[1-6]$/i.test(cur[0]?.tagName || '')) {
      block.push(cur);
      cur = cur.next();
    }
    if (!block.length) {
      LOG('no content after heading; returning original');
      return html;
    }

    const raw = block
      .map(n => $(n).text().replace(/\u00A0/g, ' '))
      .join(' ')
      .replace(/\s+/g, ' ')
      .replace(/\[\[DOI\|[^\]]+\]\]/gi, '[DOI]')
      .replace(/\[DOI\|[^\]]+\]/gi, '[DOI]')
      .trim();

    const entries = splitIntoEntries(raw);
    LOG('entries from raw split=', entries.length);

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

    bib.after($ol);
    LOG('created <ol> with li count=', entries.length);
    return $.html();
  } catch (e: any) {
    LOG('ERROR', e?.message || e);
    return html;
  }
}