// Enhanced DOM glue function to preserve spaces and prevent text wrapping issues
export const enhancedDomGlueScript = `
  console.log('[@glue] start');
  
  // Helper to append elements with proper spacing
  function appendWithSpace(parent, el, addSpaceBefore) {
    if (addSpaceBefore && el.nodeType === Node.ELEMENT_NODE) {
      parent.appendChild(document.createTextNode(' '));
    }
    parent.appendChild(el);
  }
  
  // Helper to check if two elements are on the same line
  function sameLine(a, b) {
    const ra = a.getClientRects();
    const rb = b.getClientRects();
    if (!ra.length || !rb.length) return true;
    return Math.abs(ra[ra.length - 1].top - rb[0].top) < 0.5;
  }
  
  // Helper to rebuild citations from tokens
  function rebuildCitations(txt) {
    const toks = Array.from(txt.querySelectorAll('.t'));
    let i = 0;
    while (i < toks.length) {
      const w = toks[i].textContent || '';
      if (w.startsWith('[')) {
        // Find end token that ends with ']'
        let j = i;
        while (j < toks.length && !(toks[j].textContent || '').endsWith(']')) j++;
        if (j < toks.length) {
          // Wrap i..j inclusive into a single .cite span, preserving spaces
          const cite = document.createElement('span');
          cite.className = 'cite';
          for (let k = i; k <= j; k++) {
            if (k > i) cite.appendChild(document.createTextNode(' '));
            cite.appendChild(toks[k].cloneNode(true));
          }
          toks[i].insertAdjacentElement('beforebegin', cite);
          for (let k = i; k <= j; k++) toks[k].remove();
          i = j + 1;
          continue;
        }
      }
      i++;
    }
  }
  
  const bulletTxts = document.querySelectorAll('.enh-bullet .txt');
  const paras = document.querySelectorAll('p:not(.enh-bullet)');
  console.log('[@glue] found', bulletTxts.length, 'bullet txts and', paras.length, 'paragraphs');
  
  // Process each text container
  [...bulletTxts, ...paras].forEach(txt => {
    if (!(txt instanceof HTMLElement)) return;
    
    // Step 1: Tokenize into spans, preserving spaces as text nodes
    if (!txt.querySelector('.tokenized')) {
      const textContent = txt.textContent || '';
      // Fix tokenization to handle punctuation properly
      // Split on whitespace, preserving the structure
      const words = textContent.split(/\\s+/).filter(Boolean);
      
      // Special handling for "word(" patterns - insert space
      const fixedWords = [];
      words.forEach(word => {
        // Check for word(something pattern and split with space
        const match = word.match(/^(.+?)\\((.+)$/);
        if (match && match[1].match(/[a-zA-Z]$/)) {
          // Word ends with letter and has ( - split them
          fixedWords.push(match[1]);
          fixedWords.push('(' + match[2]);
        } else {
          fixedWords.push(word);
        }
      });
      
      // Clear and rebuild with explicit text nodes for spaces
      txt.innerHTML = '';
      fixedWords.forEach((word, idx) => {
        if (idx > 0) txt.appendChild(document.createTextNode(' '));
        const span = document.createElement('span');
        span.className = 't tokenized';
        span.textContent = word;
        txt.appendChild(span);
      });
      
      // Step 2: Rebuild citations from tokens
      rebuildCitations(txt);
    }
    
    // Step 3: Fix parenthesis spacing - glue word with following (
    const tokens = Array.from(txt.querySelectorAll('.t'));
    for (let i = 0; i < tokens.length - 1; i++) {
      const cur = tokens[i + 1].textContent || '';
      if (cur.startsWith('(')) {
        const glue = document.createElement('span');
        glue.className = 'nowrap glue';
        glue.appendChild(tokens[i].cloneNode(true));
        glue.appendChild(document.createTextNode(' '));
        glue.appendChild(tokens[i + 1].cloneNode(true));
        tokens[i].insertAdjacentElement('beforebegin', glue);
        tokens[i].remove();
        tokens[i + 1].remove();
      }
    }
    
    // Step 4: Glue citations with preceding words (up to 4 tokens)
    txt.querySelectorAll('.cite').forEach(cite => {
      if (!(cite instanceof HTMLElement)) return;
      
      let attempts = 0;
      let glued = false;
      
      while (attempts < 4 && !glued) {
        const toGlue = [];
        let node = cite.previousSibling;
        let tokenCount = 0;
        
        // Collect preceding tokens and spaces
        while (node && tokenCount <= attempts) {
          if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('t')) {
            tokenCount++;
          }
          toGlue.unshift(node);
          node = node.previousSibling;
        }
        
        if (toGlue.length > 0) {
          const glue = document.createElement('span');
          glue.className = 'nowrap glue';
          
          // Clone and append all nodes (tokens and text nodes)
          toGlue.forEach(n => glue.appendChild(n.cloneNode(true)));
          glue.appendChild(cite.cloneNode(true));
          
          // Insert and test
          cite.insertAdjacentElement('beforebegin', glue);
          
          // Check if on same line
          const firstToken = glue.querySelector('.t');
          const citeInGlue = glue.querySelector('.cite');
          if (firstToken && citeInGlue && sameLine(firstToken, citeInGlue)) {
            // Success - remove originals
            toGlue.forEach(n => n.parentNode?.removeChild(n));
            cite.remove();
            glued = true;
          } else {
            // Failed - undo
            glue.remove();
            attempts++;
          }
        } else {
          break;
        }
      }
      
      // If still not glued, just make citation nowrap
      if (!glued) {
        cite.classList.add('nowrap');
      }
    });
    
    // Step 5: Stronger tail orphan prevention (glue last 4 tokens if orphan detected)
    const finalTokens = Array.from(txt.querySelectorAll('.t'));
    if (finalTokens.length >= 5) {
      const lastRects = finalTokens.slice(-5).map(el => {
        const rect = el.getClientRects()[0];
        return rect ? rect.top : 0;
      });
      const uniqueTops = new Set(lastRects.map(t => Math.round(t)));
      
      // If last 1-3 tokens are on a new line
      if (uniqueTops.size > 1) {
        // Find how many tokens are on the last line
        const lastLineTop = lastRects[lastRects.length - 1];
        let orphanCount = 0;
        for (let i = lastRects.length - 1; i >= 0; i--) {
          if (Math.abs(lastRects[i] - lastLineTop) < 0.5) orphanCount++;
          else break;
        }
        
        if (orphanCount <= 3) {
          // Glue last 4 tokens together
          const glue = document.createElement('span');
          glue.className = 'nowrap glue';
          const startIdx = finalTokens.length - 4;
          const toGlue = finalTokens.slice(startIdx);
          
          // Collect all nodes between and including these tokens
          let node = toGlue[0];
          const endNode = toGlue[toGlue.length - 1];
          const parent = node.parentElement;
          
          if (parent) {
            parent.insertBefore(glue, node);
            while (node && node !== endNode.nextSibling) {
              const next = node.nextSibling;
              glue.appendChild(node);
              node = next;
            }
          }
        }
      }
    }
  });
  
  // Step 6: Normalize Bibliography into discrete items
  const heads = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,p')).filter(h => /Bibliography/i.test(h.textContent || ''));
  if (heads.length) {
    let bibContainer = heads[0].nextElementSibling;
    
    // Sometimes bibliography is in multiple paragraphs, collect them all
    const bibParagraphs = [];
    while (bibContainer && bibContainer.tagName === 'P' && /^\\d+\\./.test(bibContainer.textContent || '')) {
      bibParagraphs.push(bibContainer);
      bibContainer = bibContainer.nextElementSibling;
    }
    
    if (bibParagraphs.length > 0) {
      // Combine all bibliography text
      const fullBibText = bibParagraphs.map(p => p.textContent).join(' ');
      
      // Split on numbered entries, being tolerant of missing spaces
      const parts = fullBibText.split(/\\s*(?=\\d+\\.\\s?)/g).filter(Boolean);
      
      // Create structured bibliography
      const wrap = document.createElement('div');
      wrap.className = 'bib';
      parts.forEach((item) => {
        // Ensure space after the number: "1. Adams", not "1.Adams"
        item = item.replace(/^(\\d+)\\.\\s*/, '$1. ');
        // Fix common spacing issues in bibliography
        item = item.replace(/([a-z])([A-Z])/g, '$1 $2'); // Fix "toidentify" -> "to identify"
        item = item.replace(/([a-z])(\\d{4})/g, '$1 $2'); // Fix "al.2007" -> "al. 2007"
        item = item.replace(/\\.(https?:\\/\\/)/g, '. $1'); // Fix ".https://" -> ". https://"
        
        const div = document.createElement('div');
        div.className = 'bib-item';
        div.textContent = item.trim();
        wrap.appendChild(div);
      });
      
      // Replace the original paragraphs with structured bibliography
      bibParagraphs[0].insertAdjacentElement('beforebegin', wrap);
      bibParagraphs.forEach(p => p.remove());
    }
  }
  
  // Count final results
  const finalCites = document.querySelectorAll('.cite').length;
  const finalGlues = document.querySelectorAll('.glue').length;
  const finalNowraps = document.querySelectorAll('.nowrap').length;
  const finalBibItems = document.querySelectorAll('.bib-item').length;
  console.log('[@glue] final counts:', { 
    cites: finalCites, 
    glues: finalGlues, 
    nowraps: finalNowraps,
    bibItems: finalBibItems 
  });
  
  console.log('[@glue] done');
`;