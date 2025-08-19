// Final Enhanced DOM glue script with all fixes
export const enhancedDomGlueFinalScript = `
  console.log('[@glue] start final enhanced processing');
  
  // Step 1: Purge <br> artifacts inside bullets & paragraphs
  console.log('[@glue] purging br artifacts');
  document.querySelectorAll('.enh-bullet .txt br, p br').forEach(br => br.replaceWith(' '));
  
  // Normalize any literal "<br>" text that slipped through
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const badTexts = [];
  while (walker.nextNode()) {
    const t = walker.currentNode;
    if (/\\<br\\s*\\/?\\>/i.test(t.nodeValue || '')) badTexts.push(t);
  }
  badTexts.forEach(t => t.nodeValue = (t.nodeValue || '').replace(/\\<br\\s*\\/?\\>/ig, ' '));
  
  // Step 2: Tokenization that preserves whitespace and markup
  console.log('[@glue] tokenizing with whitespace preservation');
  function tokenizePreservingSpaces(el) {
    const frag = document.createDocumentFragment();
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        const parts = (node.textContent || '').match(/(\\s+|\\S+)/g) || [];
        parts.forEach(part => {
          if (/^\\s+$/.test(part)) {
            const span = document.createElement('span');
            span.className = 'ws tokenized';
            span.textContent = part;
            frag.appendChild(span);
          } else {
            const span = document.createElement('span');
            span.className = 't tokenized';
            span.textContent = part;
            frag.appendChild(span);
          }
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Keep inline markup intact but recurse
        const wrapper = document.createElement('span');
        wrapper.className = 'inline tokenized';
        wrapper.appendChild(node.cloneNode(true));
        frag.appendChild(wrapper);
      }
    }
    el.replaceChildren(frag);
  }
  
  document.querySelectorAll('.enh-bullet .txt, p').forEach(el => {
    if (!el.querySelector('.tokenized')) tokenizePreservingSpaces(el);
  });
  
  // Step 3: Rebuild citations from tokens
  console.log('[@glue] rebuilding citations');
  function rebuildCitationsIn(el) {
    const toks = Array.from(el.querySelectorAll(':scope > .t, :scope > .ws, :scope > .inline'));
    for (let i = 0; i < toks.length; i++) {
      const text = toks[i].textContent || '';
      if (text.startsWith('[')) {
        let j = i;
        while (j < toks.length && !(toks[j].textContent || '').endsWith(']')) j++;
        if (j < toks.length) {
          const cite = document.createElement('span');
          cite.className = 'cite';
          for (let k = i; k <= j; k++) {
            cite.appendChild(toks[k]);
          }
          toks[i].insertAdjacentElement('beforebegin', cite);
          i = j; // skip past the citation we just created
        }
      }
    }
  }
  
  document.querySelectorAll('.enh-bullet .txt, p').forEach(el => rebuildCitationsIn(el));
  
  // Step 4: Fix "word(" and strengthen gluing
  console.log('[@glue] applying glue logic');
  
  const isWord = (n) => n && (n.classList.contains('t') || n.classList.contains('inline'));
  const isSpace = (n) => n && n.classList.contains('ws');
  
  function sameLine(a, b) {
    const ra = a.getClientRects();
    const rb = b.getClientRects();
    return ra.length && rb.length && Math.abs(ra[ra.length-1].top - rb[0].top) < 0.75;
  }
  
  function glueSpan(nodes) {
    const glue = document.createElement('span');
    glue.className = 'nowrap glue';
    nodes.forEach(n => glue.appendChild(n));
    nodes[0].insertAdjacentElement('beforebegin', glue);
    return glue;
  }
  
  function ensureSpaceBeforeParen(el) {
    const toks = Array.from(el.querySelectorAll(':scope > .t, :scope > .ws, :scope > .inline'));
    for (let i = 1; i < toks.length; i++) {
      const cur = toks[i];
      if (isWord(cur) && /^\\(/.test(cur.textContent || '')) {
        const prev = toks[i-1];
        if (isWord(prev)) {
          // insert a space token before '('
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
      // Collect up to 4 preceding word/space tokens
      let ptr = cite.previousElementSibling;
      const group = [];
      let words = 0;
      
      while (ptr && words < 4) {
        if (isWord(ptr) || isSpace(ptr)) {
          group.unshift(ptr);
          if (isWord(ptr)) words++;
        }
        ptr = ptr.previousElementSibling;
      }
      
      group.push(cite);
      
      if (group.length > 1) {
        const glue = glueSpan(group);
        
        // If it still wraps, iteratively add one more word
        let attempts = 0;
        while (attempts < 3) {
          const first = glue.firstElementChild;
          const last = glue.lastElementChild;
          if (sameLine(first, last)) break;
          
          const before = glue.previousElementSibling;
          if (!before || !isWord(before)) break;
          
          // Move preceding word plus any spaces into glue
          const toMove = [];
          let p = before;
          while (p && (isSpace(p) || (isWord(p) && toMove.length === 0))) {
            toMove.unshift(p);
            const next = p.previousElementSibling;
            if (isWord(p)) break;
            p = next;
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
        const end = last4WordIdxs[last4WordIdxs.length - 1];
        
        for (let i = start; i <= end && i < toks.length; i++) {
          nodesToGlue.push(toks[i]);
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
  
  // Step 5: Bibliography normalization
  console.log('[@glue] normalizing bibliography');
  
  // Find the "Bibliography" heading
  const heading = Array.from(document.querySelectorAll('h1,h2,h3,p,strong,em'))
    .find(el => /^(Bibliography|References)\\s*$/i.test((el.textContent || '').trim()));
  
  if (heading) {
    // Gather following siblings until the next heading or end
    const collected = [];
    let n = heading.nextElementSibling;
    while (n && !/^H[1-6]$/i.test(n.tagName)) {
      collected.push(n);
      n = n.nextElementSibling;
    }
    
    const text = collected.map(el => el.textContent || '').join(' ').replace(/\\s+/g, ' ').trim();
    
    // Split into numbered items
    const parts = text.split(/(?=\\b\\d+\\.\\s?)/g).map(s => s.trim()).filter(Boolean);
    
    // Build clean block
    const wrap = document.createElement('div');
    wrap.className = 'bib';
    parts.forEach(item => {
      // Enforce "n. " spacing
      item = item.replace(/^(\\d+)\\.\\s*/, '$1. ');
      const div = document.createElement('div');
      div.className = 'bib-item';
      div.textContent = item;
      wrap.appendChild(div);
    });
    
    // Replace old nodes with the clean block
    collected.forEach(el => el.remove());
    heading.insertAdjacentElement('afterend', wrap);
  }
  
  // Final counts
  const finalCites = document.querySelectorAll('.cite').length;
  const finalGlues = document.querySelectorAll('.glue').length;
  const finalBibItems = document.querySelectorAll('.bib-item').length;
  const brCount = document.querySelectorAll('br').length;
  const literalBrCount = document.body.innerHTML.match(/&lt;br/gi)?.length || 0;
  
  console.log('[@glue] final counts:', {
    cites: finalCites,
    glues: finalGlues,
    bibItems: finalBibItems,
    brElements: brCount,
    literalBrText: literalBrCount
  });
  
  console.log('[@glue] done');
`;