import jsPDF from 'jspdf';

// Export color palette
export const colors = {
  primary: { r: 11, g: 83, b: 148 }, // Medical blue
  text: { r: 0, g: 0, b: 0 }, // Pure black for readability
  gray: { r: 100, g: 100, b: 100 }, // Medium gray for taglines
  lightGray: { r: 200, g: 200, b: 200 }, // Light gray for borders
  background: { r: 248, g: 249, b: 250 }, // Very light gray
  lightBlue: { r: 230, g: 244, b: 255 }, // Light blue for key takeaways
  danger: { r: 220, g: 53, b: 69 } // Red for warnings
};

// Export spacing constants
export const spacing = {
  line: 7,
  paragraph: 14,
  section: 28,
  header: 22,
  afterHeader: 8,
  exercise: 8,
  beforeBullets: 10,    // LIST_GAP_BEFORE
  afterBullets: 8,      // LIST_GAP_AFTER  
  bulletGap: 4,         // LIST_GAP_BETWEEN
  footer: 40,
  afterInfoBox: 20
};

// Track list state
let inBulletList = false;

// Strict bullet detection
export const shouldAddBullet = (line: string, context: { 
  previousLine: string, 
  nextLine: string,
  isFirstInParagraph: boolean 
}): boolean => {
  const trimmed = line.trim();
  
  // ONLY add bullets for these EXACT patterns:
  // 1. Lines that explicitly start with bullet markers
  if (/^[•\-]\s+/.test(trimmed)) return true;
  
  // 2. NEVER add bullets for:
  if (trimmed.length > 60) return false; // Long sentences
  if (context.isFirstInParagraph) return false; // First line of any paragraph
  if (trimmed.endsWith('.')) return false; // Complete sentences
  if (trimmed.includes('radiculopathy')) return false; // Key medical terms
  
  // 3. Only consider colon-lists if they're short labels
  if (trimmed.includes(':')) {
    const [label, desc] = trimmed.split(':');
    return label.length < 20 && desc?.trim().length > 0;
  }
  
  return false;
};

// Helper function to join text with proper spacing
export const joinWithSpace = (a: string, b: string): string => {
  if (!a) return b;
  if (!b) return a;
  const needsSpace = !/[ \t\n]$/.test(a) && !/^[,.;:!?]/.test(b);
  return needsSpace ? `${a} ${b}` : a + b;
};

// Smart text wrapping - working implementation
export const smartWrap = (doc: jsPDF, text: string, maxWidth: number): string[] => {
  // Clean the text first
  const cleaned = (text || '').replace(/\s+/g, ' ').trim();
  
  // ALWAYS use the full width, don't reduce it
  const actualWidth = Math.min(maxWidth, 160); // Never exceed 160mm for A4
  
  // Use jsPDF's native splitting
  return doc.splitTextToSize(cleaned, actualWidth);
};

// Check for new page with proper spacing and footer reserve
export const checkNewPage = (
  doc: jsPDF, 
  yPosition: number, 
  requiredSpace: number = 30,
  pageHeight: number,
  margin: number,
  addFooter: () => void,
  maybeExitList?: () => void
): { needsNewPage: boolean; newY: number } => {
  const reserve = requiredSpace + spacing.footer + 30; // 30px safety as specified
  
  if (yPosition + reserve > pageHeight - margin) {
    // Always call maybeExitList() before adding a page
    if (maybeExitList) {
      maybeExitList();
    }
    addFooter();
    doc.addPage();
    return { needsNewPage: true, newY: margin + spacing.header };
  }
  
  return { needsNewPage: false, newY: yPosition };
};

// Add styled section header
export const addSectionHeader = (
  doc: jsPDF,
  title: string,
  yPosition: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
  addFooter: () => void
): number => {
  const lines = smartWrap(doc, title.toUpperCase(), pageWidth - 40);
  const headerHeight = 20 + (lines.length - 1) * 10;
  
  // FIXED: Better page break logic - check if header + some content fits
  // We need at least the header + 40mm for some content
  const neededSpace = headerHeight + 40;
  if (yPosition + neededSpace > pageHeight - margin) {
    addFooter();
    doc.addPage();
    yPosition = margin;
  }
  
  // Draw blue background
  doc.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.rect(0, yPosition, pageWidth, headerHeight, 'F');
  
  // Draw title lines
  lines.forEach((line, i) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(line, margin, yPosition + 13 + i * 10);
  });
  
  return yPosition + headerHeight + spacing.header;
};

// Add information box
export const addInfoBox = (
  doc: jsPDF,
  title: string,
  content: string,
  yPosition: number,
  contentWidth: number,
  margin: number,
  pageHeight: number,
  addFooter: () => void,
  color = colors.lightBlue
): number => {
  // Use nearly full width for box content
  const boxTextWidth = Math.min(contentWidth - 5, 155); // 5mm padding total
  const lines = smartWrap(doc, content, boxTextWidth);
  const boxHeight = (lines.length * spacing.line) + 30;
  
  // Check if we need a new page
  const pageCheck = checkNewPage(doc, yPosition, boxHeight + 20, pageHeight, margin, addFooter);
  if (pageCheck.needsNewPage) {
    yPosition = pageCheck.newY;
  }
  
  // Background
  doc.setFillColor(color.r, color.g, color.b);
  doc.rect(margin, yPosition, contentWidth, boxHeight, 'F');
  
  // Border
  doc.setDrawColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPosition, contentWidth, boxHeight, 'S');
  
  // Title
  yPosition += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.text(title.toUpperCase(), margin + 5, yPosition);
  
  // Content
  yPosition += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12); // FIXED: Increased from 11 for readability
  doc.setTextColor(0, 0, 0); // FIXED: Pure black, not gray
  for (const line of lines) {
    doc.text(line, margin + 5, yPosition);
    yPosition += spacing.line;
  }
  
  // Always add spacing.afterInfoBox after box
  return yPosition + spacing.afterInfoBox;
};

// Bullet list management
export const enterBulletList = (yPosition: number): number => {
  if (!inBulletList) {
    inBulletList = true;
    return yPosition + spacing.beforeBullets;
  }
  return yPosition;
};

export const exitBulletList = (yPosition: number): number => {
  if (inBulletList) {
    inBulletList = false;
    return yPosition + spacing.afterBullets;
  }
  return yPosition;
};

export const addBulletItem = (
  doc: jsPDF,
  text: string,
  yPosition: number,
  margin: number,
  contentWidth: number
): number => {
  if (inBulletList) {
    yPosition += spacing.bulletGap;
  }
  
  // Draw bullet circle with 1.7px radius
  doc.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.circle(margin + 3, yPosition - 2, 1.7, 'F');
  
  // First line starts at margin + 8
  const indent = margin + 8;
  
  // Wrap text with proper bullet indent
  const wrappedLines = smartWrap(doc, text, contentWidth - 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12); // FIXED: Increased from 11 for readability
  doc.setTextColor(0, 0, 0); // FIXED: Pure black, not gray
  
  // Draw first line
  if (wrappedLines.length > 0) {
    doc.text(wrappedLines[0], indent, yPosition);
    yPosition += spacing.line;
  }
  
  // Draw wrapped lines with same indent (not flush left)
  for (let i = 1; i < wrappedLines.length; i++) {
    doc.text(wrappedLines[i], indent, yPosition);
    yPosition += spacing.line;
  }
  
  return yPosition;
};

// Add footer with line
export const addFooter = (
  doc: jsPDF,
  pageNumber: number,
  pageWidth: number,
  pageHeight: number,
  margin: number
): void => {
  // Horizontal line
  doc.setDrawColor(colors.lightGray.r, colors.lightGray.g, colors.lightGray.b);
  doc.setLineWidth(0.5);
  doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
  
  // Footer text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
  doc.text('PainOptix™ Educational Content', margin, pageHeight - 10);
  doc.text(`Page ${pageNumber}`, pageWidth - margin - 10, pageHeight - 10);
};

// Bibliography entry interface
export interface BibEntry {
  index: number;
  text: string;
}

// Detect bibliography start
export const isBibStart = (line: string): boolean => {
  return /^##\s*BIBLIOGRAPHY/i.test(line);
};

// Parse bibliography entries
export const parseBibliography = (lines: string[]): BibEntry[] => {
  const bib: BibEntry[] = [];
  let inBibliography = false;
  let currentEntry: BibEntry | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (isBibStart(l)) {
      inBibliography = true;
      continue;
    }
    if (!inBibliography) continue;

    // New entry: "^\d+\.\s"
    const newMatch = l.match(/^(\d+)\.\s+(.*)/);
    if (newMatch) {
      // Save previous entry if exists
      if (currentEntry) {
        bib.push(currentEntry);
      }
      currentEntry = { index: Number(newMatch[1]), text: newMatch[2] };
      continue;
    }

    // Continuation line (NOT starting with number) - including DOI URLs
    if (currentEntry && !/^\d+\./.test(l) && l.trim()) {
      // Glue DOI/URL lines with preceding text
      if (isDOIUrl(l) || /^https?:\/\//i.test(l)) {
        currentEntry.text = `${currentEntry.text} ${l.trim()}`;
      } else {
        currentEntry.text = `${currentEntry.text} ${(l || '').replace(/\s+/g, ' ').trim()}`;
      }
    }
  }
  
  // Don't forget the last entry
  if (currentEntry) {
    bib.push(currentEntry);
  }
  
  return bib;
};

// Render bibliography entries
export const renderBibliography = (
  doc: jsPDF,
  entries: BibEntry[],
  yPosition: number,
  margin: number,
  contentWidth: number,
  pageHeight: number,
  checkNewPage: (space: number) => { needsNewPage: boolean; newY: number }
): number => {
  const indent = 10; // 10px indent for hanging lines
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9); // 9pt font as specified
  doc.setTextColor(60, 60, 60); // Darker gray as specified
  
  entries.forEach(({ index, text }) => {
    // Estimate space needed (approx 6px per line + 8px gap)
    const estimatedLines = Math.ceil(doc.getTextWidth(text) / (contentWidth - indent));
    const estimatedSpace = (estimatedLines * 6) + 8;
    
    const pageCheck = checkNewPage(estimatedSpace);
    if (pageCheck.needsNewPage) {
      yPosition = pageCheck.newY;
    }
    
    const prefix = `${index}. `;
    const prefixWidth = doc.getTextWidth(prefix);
    
    // Special handling for entries with DOI URLs
    const parts = text.split(/\s+(https?:\/\/)/); // Split on URL start
    let currentText = '';
    const processedParts: string[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === 'https://' || parts[i] === 'http://') {
        // Found URL start, combine with next part
        if (i + 1 < parts.length) {
          processedParts.push(parts[i] + parts[i + 1]);
          i++; // Skip next part since we combined it
        }
      } else {
        processedParts.push(parts[i]);
      }
    }
    
    // Now wrap the text, keeping URLs intact
    const entryLines: string[] = [];
    let currentLine = '';
    
    for (const part of processedParts) {
      if (isDOIUrl(part)) {
        // URL - add on its own line if needed
        if (currentLine && doc.getTextWidth(currentLine + ' ' + part) > contentWidth - indent) {
          entryLines.push(currentLine.trim());
          currentLine = part;
        } else {
          currentLine = currentLine ? currentLine + ' ' + part : part;
        }
      } else {
        // Regular text - wrap normally
        const words = part.split(/\s+/);
        for (const word of words) {
          const testLine = currentLine ? currentLine + ' ' + word : word;
          if (doc.getTextWidth(testLine) > contentWidth - indent) {
            if (currentLine) entryLines.push(currentLine.trim());
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
      }
    }
    if (currentLine) entryLines.push(currentLine.trim());
    
    // First line with number
    if (entryLines.length > 0) {
      doc.text(prefix, margin, yPosition);
      doc.text(entryLines[0], margin + prefixWidth, yPosition);
      yPosition += 5; // 5px lineGap as specified
    }
    
    // Hanging indent for subsequent lines (including URLs)
    for (let i = 1; i < entryLines.length; i++) {
      doc.text(entryLines[i], margin + indent, yPosition);
      yPosition += 5; // 5px lineGap as specified
    }
    
    yPosition += 5; // 5px gap between entries
  });
  
  return yPosition;
};

// Reset list state (call at start of each section)
export const resetListState = (): void => {
  inBulletList = false;
};

// Helper to check if most words are capitalized
const wordsCapitalised = (line: string): number => {
  const words = line.split(/\s+/).filter(w => w.length > 2);
  if (words.length === 0) return 0;
  const capitalWords = words.filter(w => /^[A-Z]/.test(w));
  return capitalWords.length / words.length;
};

// Improved section header detection
export const looksLikeHeading = (line: string): boolean => {
  const t = line.trim();
  
  // Never trigger on URLs/DOIs or file extensions
  if (/^https?:\/\//i.test(t)) return false;
  if (/doi\.org/i.test(t)) return false;
  if (/\.[a-z]{2,4}$/i.test(t)) return false;  // file paths or extensions
  
  return (
    /^[A-Z0-9][A-Z0-9 ]{8,}$/.test(t) &&  // old ALL-CAPS rule
    !t.includes('/')                        // no slashes (URLs)
  );
};

// Check if line is a section header (excluding URLs) - LEGACY, kept for compatibility
export const isSectionHeader = (line: string): boolean => {
  return looksLikeHeading(line) || isAllCapsHeader(line);
};

// Improved ALL-CAPS header detection
export const isAllCapsHeader = (line: string): boolean => {
  const t = line.trim();
  if (t.length < 10) return false;                 // too short
  if (/^https?:\/\//i.test(t)) return false;     // URL
  if (/^https?:\/\/(dx\.)?doi\.org\//i.test(t)) return false; // DOI URL
  if (/doi\.org/i.test(t)) return false;         // DOI
  if (/[a-z]/.test(t)) return false;              // contains lowercase
  if (!/[A-Z]/.test(t)) return false;             // no uppercase at all
  if (/^[A-Z0-9\s]{10,}$/.test(t) && !t.includes('/') && !t.includes('.')) {
    return true;
  }
  return false;
};

// Check if line is a DOI URL
export const isDOIUrl = (line: string): boolean => {
  return /^https?:\/\/(dx\.)?doi\.org\//i.test(line.trim());
};

// Check if paragraph is an orphaned title block that should be skipped
export const isOrphanTitle = (paragraph: string, tier: string): boolean => {
  // Only apply to free and enhanced tiers
  if (tier === 'monograph' || tier === 'comprehensive') return false;
  
  const p = paragraph.trim();
  
  // Very specific match for the exact front-matter title block only
  return /^PainOptix™\s+(Educational|Enhanced Clinical)\s+Guide$/i.test(p) ||
         /^PainOptix™.*Evidence-Based Information/i.test(p);
};