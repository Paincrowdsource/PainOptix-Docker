// Final shipping version of Enhanced DOM glue with all fixes
export const enhancedDomGlueShipScript = `
  console.log('[@glue] start final enhanced processing - shipping version');
  
  // Helper function to check if element is inside bibliography
  function insideBibliography(el) {
    if (!el) return false;
    return !!(el.closest?.('.bibliography') ||
             el.closest?.('section[id="bibliography"]') ||
             el.closest?.('section[aria-label="Bibliography"]') ||
             el.closest?.('ol.bibliography'));
  }
  
  // Step 1: Pre-tokenization cleanup - kill EVERY <br> form
  console.log('[@glue] purging all br artifacts');
  
  // Replace real <br> elements with a space
  document.querySelectorAll('.enh-bullet .txt br, p br, li br, div br, span br, td br').forEach(br => br.replaceWith(' '));
  
  // Replace *literal* "<br>" and escaped "&lt;br&gt;" inside text nodes with a space
  // Also handle mixed escaped forms like "&lt;<br>" or "<br&gt;" 
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const hits = [];
  while (walker.nextNode()) {
    const t = walker.currentNode;
    const s = t.nodeValue || '';
    // Check for any form of br tags
    if (/<\\s*br\\s*\\/?\\s*>/i.test(s) || 
        /&lt;\\s*br\\s*\\/?\\s*&gt;/i.test(s) ||
        /&lt;\\s*br\\s*\\/?\\s*>/i.test(s) ||
        /<\\s*br\\s*\\/?\\s*&gt;/i.test(s)) {
      hits.push(t);
    }
  }
  hits.forEach(t => {
    t.nodeValue = (t.nodeValue || '')
      .replace(/<\\s*br\\s*\\/?\\s*>/ig, ' ')
      .replace(/&lt;\\s*br\\s*\\/?\\s*&gt;/ig, ' ')
      .replace(/&lt;\\s*br\\s*\\/?\\s*>/ig, ' ')
      .replace(/<\\s*br\\s*\\/?\\s*&gt;/ig, ' ')
      // Also handle mixed forms
      .replace(/&lt;<br>/gi, ' ')
      .replace(/<br&gt;/gi, ' ')
      .replace(/&lt;<br&gt;/gi, ' ');
  });
  
  // Step 2: Tokenization that preserves whitespace
  console.log('[@glue] tokenizing with whitespace preservation');
  function tokenizePreservingSpaces(el) {
    const frag = document.createDocumentFragment();
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        const parts = (node.textContent || '').match(/(\\s+|\\S+)/g) || [];
        parts.forEach(part => {
          const span = document.createElement('span');
          if (/^\\s+$/.test(part)) {
            span.className = 'ws tokenized';
            span.textContent = part;
          } else {
            span.className = 't tokenized';
            span.textContent = part;
          }
          frag.appendChild(span);
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Keep inline markup intact
        const wrapper = document.createElement('span');
        wrapper.className = 'inline tokenized';
        wrapper.appendChild(node.cloneNode(true));
        frag.appendChild(wrapper);
      }
    }
    el.replaceChildren(frag);
  }
  
  document.querySelectorAll('.enh-bullet .txt, p').forEach(el => {
    if (insideBibliography(el)) return; // DO NOT touch bibliography
    if (!el.querySelector('.tokenized')) tokenizePreservingSpaces(el);
  });
  
  // Step 3: Rebuild citations from tokens (not regex)
  console.log('[@glue] rebuilding citations from tokens');
  function rebuildCitationsIn(el) {
    if (insideBibliography(el)) return; // DO NOT touch bibliography
    const toks = Array.from(el.querySelectorAll(':scope > .t, :scope > .ws, :scope > .inline'));
    for (let i = 0; i < toks.length; i++) {
      const text = toks[i].textContent || '';
      if (text.startsWith('[')) {
        let j = i;
        // Scan until we find the closing ]
        while (j < toks.length && !(toks[j].textContent || '').endsWith(']')) j++;
        if (j < toks.length) {
          // Create citation span containing all tokens from i to j
          const cite = document.createElement('span');
          cite.className = 'cite';
          // Insert the cite span BEFORE moving elements into it
          const insertBefore = toks[i];
          if (insertBefore && insertBefore.parentElement) {
            insertBefore.parentElement.insertBefore(cite, insertBefore);
            // Now move tokens into cite (preserving whitespace tokens)
            for (let k = i; k <= j; k++) {
              if (toks[k] && toks[k].parentElement) {
                cite.appendChild(toks[k]);
              }
            }
          }
          i = j; // skip past the citation
        }
      }
    }
  }
  
  document.querySelectorAll('.enh-bullet .txt, p').forEach(el => rebuildCitationsIn(el));
  
  // Step 4: Strengthen gluing rules
  console.log('[@glue] applying strengthened glue logic');
  
  const isWord = (n) => n && (n.classList.contains('t') || n.classList.contains('inline'));
  const isSpace = (n) => n && n.classList.contains('ws');
  
  function sameLine(a, b) {
    const ra = a.getClientRects();
    const rb = b.getClientRects();
    return ra.length && rb.length && Math.abs(ra[ra.length-1].top - rb[0].top) < 0.75;
  }
  
  function glueSpan(nodes) {
    if (!nodes.length) return null;
    if (nodes[0] && insideBibliography(nodes[0])) return null; // DO NOT touch bibliography
    const glue = document.createElement('span');
    glue.className = 'nowrap glue';
    // Insert glue BEFORE moving nodes into it
    const insertBefore = nodes[0];
    if (insertBefore && insertBefore.parentElement) {
      insertBefore.parentElement.insertBefore(glue, insertBefore);
    }
    // Now move nodes into glue (preserving their original order and spacing)
    nodes.forEach(n => glue.appendChild(n));
    return glue;
  }
  
  function ensureSpaceBeforeParen(el) {
    const toks = Array.from(el.querySelectorAll(':scope > .t, :scope > .ws, :scope > .inline, :scope > .cite'));
    for (let i = 1; i < toks.length; i++) {
      const cur = toks[i];
      if (isWord(cur) && /^\\(/.test(cur.textContent || '')) {
        const prev = toks[i-1];
        if (isWord(prev)) {
          // Insert a space token before '('
          const ws = document.createElement('span');
          ws.className = 'ws tokenized';
          ws.textContent = ' ';
          cur.insertAdjacentElement('beforebegin', ws);
        }
      }
    }
  }
  
  function glueCitations(el) {
    ensureSpaceBeforeParen(el);
    const cites = Array.from(el.querySelectorAll(':scope > .cite'));
    
    cites.forEach(cite => {
      // Collect up to 4 preceding word tokens with their spaces
      const toGlue = [];
      let ptr = cite.previousElementSibling;
      let words = 0;
      
      while (ptr && words < 4) {
        if (isWord(ptr)) {
          words++;
          toGlue.unshift(ptr);
          ptr = ptr.previousElementSibling;
          // Also grab preceding spaces
          while (ptr && isSpace(ptr)) {
            toGlue.unshift(ptr);
            ptr = ptr.previousElementSibling;
          }
        } else if (isSpace(ptr)) {
          ptr = ptr.previousElementSibling;
        } else {
          break;
        }
      }
      
      toGlue.push(cite);
      
      if (toGlue.length > 1) {
        const glue = glueSpan(toGlue);
        
        // If still breaking, greedily add more preceding words
        let attempts = 0;
        while (glue && attempts < 3) {
          const first = glue.firstElementChild;
          const last = glue.lastElementChild;
          if (sameLine(first, last)) break;
          
          const before = glue.previousElementSibling;
          if (!before || !isWord(before)) break;
          
          // Move preceding word plus any spaces into glue
          const toMove = [before];
          let p = before.previousElementSibling;
          while (p && isSpace(p)) {
            toMove.unshift(p);
            p = p.previousElementSibling;
          }
          
          toMove.forEach(n => glue.insertBefore(n, glue.firstChild));
          attempts++;
        }
      }
    });
  }
  
  function glueTail(el) {
    const toks = Array.from(el.querySelectorAll(':scope > .t, :scope > .ws, :scope > .inline, :scope > .cite, :scope > .glue'));
    if (!toks.length) return;
    
    // Find last-line tokens by rect.top
    const rects = toks.map(n => {
      const rect = n.getClientRects()[0];
      return rect ? rect.top : 0;
    });
    
    const maxTop = Math.max(...rects);
    const lastLineIdxs = [];
    toks.forEach((tok, i) => {
      if (Math.abs(rects[i] - maxTop) < 0.75) {
        lastLineIdxs.push(i);
      }
    });
    
    // Count words on last line
    const lastLineWords = lastLineIdxs.filter(i => isWord(toks[i]));
    
    if (lastLineWords.length > 0 && lastLineWords.length <= 3) {
      // Find the last 4 word tokens
      const wordIdxs = [];
      toks.forEach((tok, i) => {
        if (isWord(tok)) wordIdxs.push(i);
      });
      
      const last4WordIdxs = wordIdxs.slice(-4);
      if (last4WordIdxs.length > 0) {
        const nodesToGlue = [];
        const start = last4WordIdxs[0];
        const end = toks.length - 1;
        
        // Include all tokens from first of last 4 words to end
        for (let i = start; i <= end; i++) {
          if (toks[i] && !toks[i].parentElement.classList.contains('glue')) {
            nodesToGlue.push(toks[i]);
          }
        }
        
        if (nodesToGlue.length > 0) {
          glueSpan(nodesToGlue);
        }
      }
    }
  }
  
  document.querySelectorAll('.enh-bullet .txt').forEach(el => {
    glueCitations(el);
    glueTail(el);
  });
  
  document.querySelectorAll('p').forEach(el => {
    glueCitations(el);
  });
  
  // Step 5: Bibliography normalization with DOI cleanup
  console.log('[@glue] normalizing bibliography with DOI cleanup');
  
  // If server already produced a semantic bibliography, do NOT rebuild it
  const existingOl = document.querySelector('ol.bibliography');
  if (existingOl) {
    console.log('[@glue] Found existing ol.bibliography, just protecting page ranges');
    // Just protect page ranges, don't rebuild
    existingOl.querySelectorAll('li').forEach(li => {
      li.innerHTML = li.innerHTML.replace(
        /(\\d+)\\s*[-–—]\\s*(\\d+)/g,
        '<span class="norun">$1&#8209;$2</span>'
      );
    });
    console.log('[@glue] Protected page ranges in', existingOl.querySelectorAll('li').length, 'entries');
  } else {
    // Find the "Bibliography" or "References" heading - check both the element itself and strong/bold children
    const heading = Array.from(document.querySelectorAll('h1,h2,h3,p,strong,em,b'))
      .find(el => {
        const text = (el.textContent || '').trim();
        if (/^(Bibliography|References)\\s*$/i.test(text)) return true;
        // Also check if this is a paragraph containing only a strong/bold with the heading
        const strongChild = el.querySelector('strong, b');
        if (strongChild && el.children.length === 1) {
          return /^(Bibliography|References)\\s*$/i.test((strongChild.textContent || '').trim());
        }
        return false;
      });
    
    if (heading) {
    // Gather following siblings until the next heading or end
    const collected = [];
    let n = heading.nextElementSibling;
    while (n && !/^H[1-6]$/i.test(n.tagName)) {
      collected.push(n);
      n = n.nextElementSibling;
    }
    
    // Combine all text
    let text = collected.map(el => el.textContent || '').join(' ').replace(/\\s+/g, ' ').trim();
    
    // First, clean up any remaining sentinel markers
    text = text.replace(/\\[\\[DOI\\|[^\\]]+\\]\\]/g, '[DOI]');
    text = text.replace(/\\[DOI\\|[^\\]]+\\]/g, '[DOI]');
    text = text.replace(/\\]\\]/g, '');
    text = text.replace(/\\[\\[/g, '');
    
    // Split into entries - try multiple strategies
    let parts = [];
    
    // Strategy 1: Split by numbered list pattern "1. Author" 
    const numbered = text.match(/\\d+\\.\\s+[A-Z][^\\d]+(?=\\d+\\.|$)/g);
    if (numbered && numbered.length > 3) {
      parts = numbered.map(s => s.trim()).filter(Boolean);
    }
    
    // Strategy 2: If no numbered entries, split after year pattern like "(2020)."
    if (!parts.length) {
      parts = text.split(/(?<=\\(\\d{4}[a-z]?\\)\\.?)\\s+(?=[A-Z][A-Za-z'\\-]+,\\s)/g)
        .map(s => s.trim())
        .filter(Boolean);
    }
    
    // Strategy 3: Split after "[DOI]" or "[DOI]."
    if (!parts.length || parts.length < 3) {
      parts = text.split(/(?<=\\[DOI\\]\\.?)\\s+(?=[A-Z])/g)
        .map(s => s.trim())
        .filter(Boolean);
    }
    
    // Fallback: Use original numbered split
    if (!parts.length) {
      parts = text.split(/(?=\\b\\d+\\.\\s?)/g).map(s => s.trim()).filter(Boolean);
    }
    
    // Build clean bibliography as ordered list
    const wrap = document.createElement('ol');
    wrap.className = 'bibliography';
    
    parts.forEach(item => {
      // Remove the leading number since <ol> will add it
      item = item.replace(/^\\d+\\.\\s*/, '');
      
      // Clean up any remaining sentinel markers
      item = item.replace(/\\[\\[DOI\\|[^\\]]+\\]\\]/g, '[DOI]');
      item = item.replace(/\\[DOI\\|[^\\]]+\\]/g, '[DOI]');
      item = item.replace(/\\]\\]/g, '');
      item = item.replace(/\\[\\[/g, '');
      item = item.replace(/\\[ \\[DOI\\]/g, '[DOI]');
      
      // DOI/URL normalization
      // Remove spaces after the 10. DOI prefix
      item = item.replace(/10\\.\\s+(\\d)/g, '10.$1');
      
      // Collapse spaces inside URLs
      item = item.replace(/(https?:\\/\\/)\\s+/g, '$1');
      item = item.replace(/doi\\.org\\/\\s+/g, 'doi.org/');
      
      // Collapse spaces around periods and slashes inside DOI patterns
      item = item.replace(/(\\d)\\s*\\.\\s*(\\d)/g, '$1.$2');
      item = item.replace(/\\/(\\d)\\s+(\\d)/g, '/$1$2');
      
      // Fix common DOI patterns
      item = item.replace(/10\\.(\\d{4})\\/([\\d\\w.-]+)/g, (match, p1, p2) => {
        // Remove spaces from DOI
        return '10.' + p1 + '/' + p2.replace(/\\s+/g, '');
      });
      
      // Add period at end if missing
      item = item.trim();
      if (!/[.?!]$/.test(item)) {
        item += '.';
      }
      
      const li = document.createElement('li');
      li.textContent = item;
      wrap.appendChild(li);
    });
    
    // Replace old nodes with the clean block
    collected.forEach(el => el.remove());
    heading.insertAdjacentElement('afterend', wrap);
    }
  }
  
  // Step 6: Automated checks
  console.log('[@glue] running automated checks');
  
  // Check for <br> artifacts
  const brElements = document.querySelectorAll('br').length;
  const literalBrCount = document.body.innerHTML.match(/&lt;br/gi)?.length || 0;
  const rawBrCount = document.body.innerHTML.match(/<br/gi)?.length || 0;
  
  // Count results
  const finalCites = document.querySelectorAll('.cite').length;
  const finalGlues = document.querySelectorAll('.glue').length;
  const finalBibItems = document.querySelectorAll('.bibliography li').length;
  
  // Check for specific required strings (for facet_arthropathy)
  const bodyText = document.body.textContent || '';
  const checks = {
    upperThighParen: bodyText.includes('upper thigh ('),
    reduceDiscomfort: bodyText.includes('reduce discomfort [Chou et al., 2007]') || 
                      bodyText.includes('reduce discomfort[Chou et al., 2007]'),
    checkingSpine: bodyText.includes('checking spine mobility'),
    facetArthropathy: (bodyText.match(/facet arthropathy/gi) || []).length,
    yourDoctor: bodyText.includes('your doctor')
  };
  
  console.log('[@glue] final counts: cites=' + finalCites + 
    ', glues=' + finalGlues + 
    ', bibItems=' + finalBibItems + 
    ', brElements=' + brElements + 
    ', literalBrText=' + literalBrCount + 
    ', rawBrText=' + rawBrCount);
  
  // Warn if issues detected
  if (brElements > 0 || literalBrCount > 0 || rawBrCount > 0) {
    console.warn('[@glue] WARNING: BR artifacts still present!');
  }
  if (finalBibItems < 5) {
    console.warn('[@glue] WARNING: Bibliography may not be properly formatted');
  }
  
  console.log('[@glue] done - shipping version complete');
`;