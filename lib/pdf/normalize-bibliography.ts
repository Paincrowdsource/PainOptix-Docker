// docker-repo/lib/pdf/normalize-bibliography.ts
import * as cheerio from 'cheerio';

const LOG = (...a: any[]) => console.error('[BIB-NORMALIZE]', ...a);

// Split a big blob of bibliography text into entries
function splitIntoEntries(raw: string): string[] {
  if (!raw) return [];
  let t = raw
    .replace(/\u00A0/g, ' ')                 // NBSP → space
    .replace(/\s+/g, ' ')
    // Normalize any DOI tokenization first so downstream splits are stable
    .replace(/\[\[DOI\|[^\]]+\]\]/gi, '[DOI]')
    .replace(/\[DOI\|[^\]]+\]/gi,  '[DOI]')
    .trim();

  const out: string[] = [];

  // Strongest: split on "(YYYY). " followed by a new author (capital)
  let parts = t.split(/(?<=\(\d{4}[a-z]?\)\.)\s+(?=[A-Z])/g);
  if (parts.length > 1) out.push(...parts);

  // If still fused, split on "[DOI]. " when followed by "Surname, I."
  if (!out.length) {
    parts = t.split(/(?<=\[DOI\]\.?)\s+(?=[A-Z][A-Za-z'`\-]+,\s*[A-Z]\.)/g);
    if (parts.length > 1) out.push(...parts);
  }

  // Classic numbered list fallback: "1. … 2. …"
  if (!out.length) {
    const numbered = t.match(/\d+\.\s+[\s\S]*?(?=\s*\d+\.\s|$)/g);
    if (numbered) out.push(...numbered.map(s => s.replace(/^\d+\.\s*/, '').trim()));
  }

  // Author-boundary fallback
  if (!out.length) {
    parts = t.split(/(?=[A-Z][a-z]+,\s*[A-Z]\.)/g);
    if (parts.length > 1) out.push(...parts);
  }

  if (!out.length) out.push(t);
  return out.map(s => s.trim()).filter(s => s.length > 30);
}

// Make one entry safe for PDF layout
function normalizeEntryText(txt: string): string {
  let s = txt
    .replace(/^\s*\d+\.\s*/, '') // strip any leading "n. "
    .replace(/\s+/g, ' ')
    // Replace all DOI forms with [DOI] to avoid slash breaks
    // Matches: doi: 10..., DOI:10..., http(s)://doi.org/..., doi.org/...
    .replace(/\bdoi:\s*\S+/gi, '[DOI]')
    .replace(/\bDOI:\s*\S+/g,  '[DOI]')
    .replace(/https?:\/\/doi\.org\/\S+/gi, '[DOI]')
    .replace(/\bdoi\.org\/\S+/gi, '[DOI]')
    // Keep page ranges on one line
    .replace(/(\d{1,4})\s*[-–—]\s*(\d{1,4})/g, '$1&#8209;$2')
    .trim();

  if (!/[.?!]$/.test(s)) s += '.';
  return s;
}

export function normalizeEnhancedBibliography(html: string): string {
  LOG('function called; input len=', html?.length || 0);
  try {
    const $ = cheerio.load(html);

    // Find "Bibliography/References" in h1–h6 or <p><strong>…</strong></p> or plain <p>
    const isTitle = (txt: string) => /^\s*(bibliography|references)\s*$/i.test(txt || '');
    const bib = $('h1,h2,h3,h4,h5,h6,p').filter((_, el) => {
      const node = $(el);
      const text = node.text().trim();
      if (isTitle(text)) return true;
      const strong = node.children('strong,b').first();
      return !!(strong.length && isTitle(strong.text().trim()));
    }).first();

    LOG('heading found?', !!bib.length, 'tag=', bib[0]?.tagName, 'text=', bib.text().trim());
    if (!bib.length) return html;

    const entries: string[] = [];

    // Case A: there's already an <ol> — clean its <li> *and* scoop up any following stray content
    const ol = bib.next('ol');
    if (ol.length) {
      LOG('found existing <ol> — splitting fused <li> and collecting trailing nodes');
      ol.find('li').each((_, li) => {
        const txt = $(li).text().replace(/\u00A0/g, ' ');
        entries.push(...splitIntoEntries(txt));
      });

      // Collect ANY siblings *after* the <ol> until next heading (this is what the screenshot shows)
      let cur = ol.next();
      const extras: any[] = [];
      while (cur.length && !/^h[1-6]$/i.test(cur[0]?.tagName || '')) {
        // Stop if we hit the disclaimer
        const text = cur.text().trim();
        if (text.includes('DISCLAIMER') || text.includes('educational guide') || text.includes('medical advice')) {
          break;
        }
        extras.push(cur);
        cur = cur.next();
      }
      if (extras.length) {
        const raw = extras.map(n => $(n).text().replace(/\u00A0/g, ' ')).join(' ').replace(/\s+/g, ' ').trim();
        const extraEntries = splitIntoEntries(raw);
        if (extraEntries.length) {
          LOG('collected trailing extras =', extraEntries.length);
          entries.push(...extraEntries);
          extras.forEach(n => n.remove());
        }
      }

      // Rebuild <ol> with ALL entries
      ol.empty();
      entries.forEach(e => ol.append(`<li>${normalizeEntryText(e)}</li>`));
      LOG('rebuilt existing <ol> with entries=', entries.length);
      return $.html();
    }

    // Case B: no <ol> — rebuild from all nodes after heading until next heading
    LOG('no <ol> — rebuilding from text between heading and next heading');
    let cur = bib.next();
    const block: any[] = [];
    while (cur.length && !/^h[1-6]$/i.test(cur[0]?.tagName || '')) {
      // Stop if we hit the disclaimer
      const text = cur.text().trim();
      if (text.includes('DISCLAIMER') || text.includes('educational guide') || text.includes('medical advice')) {
        break;
      }
      block.push(cur);
      cur = cur.next();
    }
    if (!block.length) return html;

    const raw = block.map(n => $(n).text().replace(/\u00A0/g, ' ')).join(' ').replace(/\s+/g, ' ').trim();
    const parts = splitIntoEntries(raw);
    if (!parts.length) return html;

    block.forEach(n => n.remove());

    const $ol = $('<ol class="bibliography"></ol>');
    parts.forEach(e => $ol.append(`<li>${normalizeEntryText(e)}</li>`));
    bib.after($ol);
    LOG('created <ol> with entries=', parts.length);
    return $.html();
  } catch (e: any) {
    LOG('ERROR', e?.message || e);
    return html;
  }
}